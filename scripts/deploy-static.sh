#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?Set AWS_REGION, for example us-east-1}"
: "${SITE_BUCKET:?Set SITE_BUCKET from terraform output site_bucket_name}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID from terraform output cloudfront_distribution_id}"

aws s3 sync dist/ "s3://${SITE_BUCKET}/" \
  --region "${AWS_REGION}" \
  --delete \
  --cache-control "public, max-age=300"

aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*"
