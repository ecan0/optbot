-- Query version: 1. Run only through optbot-analysis against a snapshot-bound table.
WITH quantitative AS (
  SELECT
    snapshot_id,
    analysis_schema_version,
    survey_flow_version,
    study_design,
    primary_outcome,
    count(*) AS response_rows,
    count(DISTINCT response_id) AS distinct_response_rows
  FROM {{quantitative_table}}
  WHERE snapshot_id = '{{snapshot_id}}'
  GROUP BY 1, 2, 3, 4, 5
), quality AS (
  SELECT
    snapshot_id,
    analysis_schema_version,
    count(*) AS quality_rows
  FROM {{quality_table}}
  WHERE snapshot_id = '{{snapshot_id}}'
  GROUP BY 1, 2
)
SELECT
  q.snapshot_id,
  q.analysis_schema_version,
  q.survey_flow_version,
  q.study_design,
  q.primary_outcome,
  q.response_rows,
  q.distinct_response_rows,
  coalesce(quality.quality_rows, 0) AS quality_rows
FROM quantitative AS q
LEFT JOIN quality ON q.snapshot_id = quality.snapshot_id
  AND q.analysis_schema_version = quality.analysis_schema_version;
