-- Query version: 1. Long-form aggregate rating distributions, grouped by randomized order.
WITH ratings AS (
  SELECT notice_presentation_order, 'visual_willingness' AS outcome, visual_willingness AS rating FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'visual_trust', visual_trust FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'visual_completeness', visual_completeness FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'visual_ease_of_use', visual_ease_of_use FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'text_willingness', text_willingness FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'text_trust', text_trust FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'text_completeness', text_completeness FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
  UNION ALL SELECT notice_presentation_order, 'text_ease_of_use', text_ease_of_use FROM {{quantitative_table}} WHERE snapshot_id = '{{snapshot_id}}'
)
SELECT notice_presentation_order, outcome, rating, count(*) AS rows
FROM ratings
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;
