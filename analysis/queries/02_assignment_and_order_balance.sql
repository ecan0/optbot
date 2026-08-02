-- Query version: 1. The visual variant and assigned slot are fixed; only presentation order is randomized.
SELECT
  notice_presentation_order,
  variant_id,
  notice_variant_id,
  assignment_method,
  assigned_notice_slot,
  count(*) AS rows
FROM {{quantitative_table}}
WHERE snapshot_id = '{{snapshot_id}}'
GROUP BY 1, 2, 3, 4, 5
ORDER BY 1, 2, 3, 4, 5;
