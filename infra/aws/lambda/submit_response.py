import base64
import json
import math
import os
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

DYNAMODB = boto3.resource("dynamodb")
SSM = boto3.client("ssm")

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://optbot.study")
TABLE_NAME = os.environ["RESPONSES_TABLE_NAME"]
RETENTION_DAYS = int(os.environ.get("RETENTION_DAYS", "365"))
REQUIRE_TURNSTILE = os.environ.get("REQUIRE_TURNSTILE", "false").lower() == "true"
TURNSTILE_SECRET_PARAMETER = os.environ.get("TURNSTILE_SECRET_PARAMETER", "")
TURNSTILE_ACTION = "survey-submit"
TURNSTILE_HOSTNAME = urllib.parse.urlparse(ALLOWED_ORIGIN).hostname or ""
TURNSTILE_SECRET = None


class TurnstileUnavailableError(Exception):
    pass


def response(status_code, body, origin=ALLOWED_ORIGIN):
    return {
        "statusCode": status_code,
        "headers": {
            "access-control-allow-origin": origin,
            "content-type": "application/json",
            "vary": "origin",
        },
        "body": json.dumps(body),
    }


def get_header(headers, name):
    if not headers:
        return ""
    wanted = name.lower()
    for key, value in headers.items():
        if key.lower() == wanted:
            return value or ""
    return ""


def parse_body(event):
    body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    return json.loads(body)


def require_string(payload, key, limit=120):
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError(f"{key} is required")
    return value.strip()


def verify_turnstile(token, remote_ip):
    global TURNSTILE_SECRET

    if not REQUIRE_TURNSTILE:
        return True
    if not TURNSTILE_SECRET_PARAMETER:
        raise TurnstileUnavailableError("Turnstile secret parameter is not configured")
    if not isinstance(token, str) or not token.strip() or len(token) > 2048:
        return False

    if TURNSTILE_SECRET is None:
        try:
            TURNSTILE_SECRET = SSM.get_parameter(
                Name=TURNSTILE_SECRET_PARAMETER,
                WithDecryption=True,
            )["Parameter"]["Value"]
        except (ClientError, KeyError) as error:
            raise TurnstileUnavailableError("Turnstile secret is unavailable") from error

    form = urllib.parse.urlencode({
        "secret": TURNSTILE_SECRET,
        "response": token.strip(),
        "remoteip": remote_ip or "",
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=form,
        headers={"content-type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=5) as siteverify:
            result = json.loads(siteverify.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise TurnstileUnavailableError("Turnstile verification is unavailable") from error

    return (
        result.get("success") is True
        and result.get("hostname") == TURNSTILE_HOSTNAME
        and result.get("action") == TURNSTILE_ACTION
    )


def normalize_answers(answers):
    if not isinstance(answers, dict) or len(answers) > 100:
        raise ValueError("answers must be an object with at most 100 keys")
    normalized = {}
    for key, value in answers.items():
        if not isinstance(key, str) or not key or len(key) > 120:
            raise ValueError("answer keys must be short strings")
        if isinstance(value, bool) or value is None:
            raise ValueError("answer values must be strings or numbers")
        if isinstance(value, int):
            normalized[key] = value
        elif isinstance(value, float) and math.isfinite(value):
            normalized[key] = Decimal(str(value))
        elif isinstance(value, str) and len(value) <= 4000:
            normalized[key] = value
        else:
            raise ValueError("answer values must be strings up to 4000 characters or finite numbers")
    return normalized


def handler(event, _context):
    origin = get_header(event.get("headers"), "origin") or ALLOWED_ORIGIN
    if origin != ALLOWED_ORIGIN:
        return response(403, {"message": "origin not allowed"}, origin="null")

    try:
        payload = parse_body(event)
        survey_id = require_string(payload, "survey_id")
        variant_id = require_string(payload, "variant_id")
        consent_version = require_string(payload, "consent_version")
        answers = normalize_answers(payload.get("answers"))
        metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        token = payload.get("turnstile_token") or get_header(event.get("headers"), "cf-turnstile-response")
        remote_ip = (event.get("requestContext", {}).get("http", {}) or {}).get("sourceIp")

        if not verify_turnstile(token, remote_ip):
            return response(403, {"message": "turnstile verification failed"}, origin=origin)

        now = datetime.now(timezone.utc).isoformat()
        response_id = str(uuid.uuid4())
        item = {
            "response_id": response_id,
            "survey_id": survey_id,
            "variant_id": variant_id,
            "submitted_at": now,
            "consent_version": consent_version,
            "answers": answers,
            "metadata": metadata,
            "expires_at": int(time.time()) + RETENTION_DAYS * 86400,
        }

        DYNAMODB.Table(TABLE_NAME).put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(response_id)",
        )
        return response(201, {"response_id": response_id}, origin=origin)
    except TurnstileUnavailableError:
        return response(503, {"message": "verification service unavailable"}, origin=origin)
    except (json.JSONDecodeError, ValueError) as error:
        return response(400, {"message": str(error)}, origin=origin)
    except ClientError:
        return response(500, {"message": "unable to store response"}, origin=origin)
