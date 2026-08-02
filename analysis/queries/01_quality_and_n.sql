-- Query version: 1. Aggregate only; quality_reasons are validation codes, never participant text.
SELECT
  snapshot_id,
  quality_status,
  quality_reasons,
  count(*) AS rows
FROM {{quality_table}}
WHERE snapshot_id = '{{snapshot_id}}'
GROUP BY 1, 2, 3
ORDER BY 2, 3;
