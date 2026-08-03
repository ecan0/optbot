-- Query version: 1. Visual minus text. Primary outcome is willingness; all other outcomes are exploratory.
WITH deltas AS (
  SELECT notice_presentation_order, 'willingness' AS outcome, willingness_delta_visual_minus_text AS delta FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'trust', trust_delta_visual_minus_text FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'completeness', completeness_delta_visual_minus_text FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'ease_of_use', ease_of_use_delta_visual_minus_text FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
)
SELECT
  notice_presentation_order,
  outcome,
  delta,
  count(*) AS rows
FROM deltas
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;
