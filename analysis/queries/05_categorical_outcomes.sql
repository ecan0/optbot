-- Query version: 1. Preference is post-pairing and is descriptive; do not treat it as an independent outcome.
SELECT
  notice_presentation_order,
  presentation_preference,
  count(*) AS rows
FROM {{quantitative_table}}
WHERE snapshot_id = '{{snapshot_id}}'
GROUP BY 1, 2
ORDER BY 1, 2;
