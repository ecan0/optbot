import importlib
import io
import json
import os
import sys
import types
import unittest
import urllib.error
from unittest.mock import Mock, patch


class FakeClientError(Exception):
    pass


class SiteverifyResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


fake_table = Mock()
fake_dynamodb = Mock()
fake_dynamodb.Table.return_value = fake_table
fake_ssm = Mock()
fake_boto3 = types.ModuleType("boto3")
fake_boto3.resource = Mock(return_value=fake_dynamodb)
fake_boto3.client = Mock(return_value=fake_ssm)
fake_botocore = types.ModuleType("botocore")
fake_botocore_exceptions = types.ModuleType("botocore.exceptions")
fake_botocore_exceptions.ClientError = FakeClientError
sys.modules.setdefault("boto3", fake_boto3)
sys.modules.setdefault("botocore", fake_botocore)
sys.modules.setdefault("botocore.exceptions", fake_botocore_exceptions)

os.environ["ALLOWED_ORIGIN"] = "https://optbot.study"
os.environ["RESPONSES_TABLE_NAME"] = "test-responses"
os.environ["REQUIRE_TURNSTILE"] = "true"
os.environ["TURNSTILE_SECRET_PARAMETER"] = "/optbot/turnstile/secret"
submit_response = importlib.import_module("submit_response")


class SubmitResponseTests(unittest.TestCase):
    def setUp(self):
        fake_table.reset_mock()
        fake_ssm.reset_mock()
        fake_ssm.get_parameter.return_value = {"Parameter": {"Value": "test-secret"}}
        submit_response.REQUIRE_TURNSTILE = True
        submit_response.TURNSTILE_SECRET_PARAMETER = "/optbot/turnstile/secret"
        submit_response.TURNSTILE_SECRET = None

    @staticmethod
    def event(token="verified-token", origin="https://optbot.study"):
        payload = {
            "survey_id": "synthetic-test-survey",
            "variant_id": "icon-led-disclosure",
            "consent_version": "ai-training-consent-v1",
            "answers": {"rating": 4},
            "metadata": {"survey_flow_version": "paired-notice-attitudes-v1.0.0"},
        }
        if token is not None:
            payload["turnstile_token"] = token
        return {
            "headers": {"origin": origin},
            "body": json.dumps(payload),
            "requestContext": {"http": {"sourceIp": "192.0.2.1"}},
        }

    @staticmethod
    def siteverify(success=True, hostname="optbot.study", action="survey-submit"):
        return SiteverifyResponse(
            json.dumps({"success": success, "hostname": hostname, "action": action}).encode("utf-8")
        )

    def test_rejects_disallowed_origin_before_verification_or_storage(self):
        result = submit_response.handler(self.event(origin="https://example.invalid"), None)

        self.assertEqual(result["statusCode"], 403)
        self.assertEqual(result["headers"]["access-control-allow-origin"], "null")
        fake_ssm.get_parameter.assert_not_called()
        fake_table.put_item.assert_not_called()

    def test_rejects_missing_and_invalid_turnstile_tokens(self):
        missing = submit_response.handler(self.event(token=None), None)
        with patch.object(
            submit_response.urllib.request,
            "urlopen",
            return_value=self.siteverify(success=False),
        ):
            invalid = submit_response.handler(self.event(), None)

        self.assertEqual(missing["statusCode"], 403)
        self.assertEqual(invalid["statusCode"], 403)
        fake_table.put_item.assert_not_called()

    def test_requires_expected_turnstile_hostname_and_action(self):
        with patch.object(
            submit_response.urllib.request,
            "urlopen",
            side_effect=[
                self.siteverify(hostname="example.invalid"),
                self.siteverify(action="different-action"),
            ],
        ):
            wrong_hostname = submit_response.handler(self.event(), None)
            wrong_action = submit_response.handler(self.event(), None)

        self.assertEqual(wrong_hostname["statusCode"], 403)
        self.assertEqual(wrong_action["statusCode"], 403)
        fake_table.put_item.assert_not_called()

    def test_stores_only_after_successful_turnstile_verification(self):
        with patch.object(
            submit_response.urllib.request,
            "urlopen",
            return_value=self.siteverify(),
        ):
            result = submit_response.handler(self.event(), None)

        self.assertEqual(result["statusCode"], 201)
        stored_item = fake_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(stored_item["survey_id"], "synthetic-test-survey")
        self.assertNotIn("turnstile_token", stored_item)
        self.assertGreater(stored_item["expires_at"], 0)

    def test_returns_service_unavailable_when_siteverify_is_unreachable(self):
        with patch.object(
            submit_response.urllib.request,
            "urlopen",
            side_effect=urllib.error.URLError("unavailable"),
        ):
            result = submit_response.handler(self.event(), None)

        self.assertEqual(result["statusCode"], 503)
        self.assertEqual(json.loads(result["body"])["message"], "verification service unavailable")
        fake_table.put_item.assert_not_called()

    def test_rejects_malformed_payload_without_storage(self):
        result = submit_response.handler(
            {"headers": {"origin": "https://optbot.study"}, "body": "{"},
            None,
        )

        self.assertEqual(result["statusCode"], 400)
        fake_table.put_item.assert_not_called()


if __name__ == "__main__":
    unittest.main()
