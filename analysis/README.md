# Snapshot-bound survey analysis

This directory contains code and aggregate Athena query templates only. It must not contain response exports, response identifiers, Athena result files, raw restricted text, cloud resource locations, or credentials. Local manifests and rendered SQL belong under `.analysis-private/`, which is ignored.

## Study contract

- Design: within-participant paired comparison. Every valid participant rates the fixed visual treatment (`icon-led-disclosure`, `visual_disclosure_ledger`, design `disclosure-ledger-v5`) and the same notice in plain text.
- Randomization: browser cryptographic random assignment of `notice_presentation_order` to `assigned-first` or `reference-first`, persisted in browser storage for the session. This is the only randomized field. `assigned_notice_slot` is always `A`; `variant_id`, `notice_variant_id`, and `assignment_method` are fixed, not random arms.
- Scale: all eight ratings are integer 1–5. Outcomes are `visual_*` and `text_*` for willingness, trust, completeness, and ease of use. Deltas are already coded `visual - text`, bounded -4 to 4.
- Primary outcome: `willingness_delta_visual_minus_text`. Trust, completeness, ease of use, order-stratified summaries, demographics, and preference are exploratory unless a pre-existing owner-approved analysis plan says otherwise.
- Categorical fields: `age_range` = `18_24|25_34|35_44|45_54|55_65|prefer_not_age`; `ai_usage_frequency` = `rarely|monthly|weekly|daily`; `presentation_preference` = `prefer_visual_notice|prefer_text_notice`.
- Inclusion: quantitative rows are valid only after the transform confirms all exact schema keys/literals, consent, acknowledgements, categories, ratings, timestamps, non-expiry, and both required text answers. `response_quality` contains `invalid` and `excluded_expired` records only; the publication workflow rejects a snapshot with any `invalid` record. Do not reinterpret transform validation as a substitute for a separately approved quality-exclusion protocol.
- Boundaries: no between-treatment causal contrast exists because the treatment itself is fixed and both surfaces are within participant. Presentation-order comparisons are randomized but small-sample descriptive checks, not a basis for post-hoc causal claims. The post-pairing preference is descriptive.

## Final-snapshot procedure

1. Wait for the maintenance owner to report a successful final Snapshot Production Results run. Never substitute the July rehearsal snapshot.
2. Create `.analysis-private/snapshot-manifest.json` from `snapshot-manifest.template.json`. Record the final snapshot ID, extraction time, Glue run ID, quantitative/restricted/quality counts, schema version, source/release SHA, and these query versions. This private manifest must not contain a bucket, object path, ARN, account ID, response ID, user agent, or participant content.
3. Bind private, snapshot-specific Athena external tables to the immutable final snapshot with the authorized snapshot-maintenance role. Record only safe table aliases in `source_binding`; set `immutable_location_verified` to `true`. Do not use moving `responses_quantitative` or `response_quality` as the analysis source.
4. Render queries locally:
   `python3 analysis/render_queries.py --manifest .analysis-private/snapshot-manifest.json --output-dir .analysis-private/rendered/<snapshot-id>`.
5. Before results, run the contract, quality/N, assignment/order, rating, paired-delta, and categorical queries only through `optbot-analysis`. They return aggregate data only. Do not use `optbot-analysis-restricted` unless the owner explicitly authorizes qualitative work.

## Analysis plan after owner authorization

Report exact N, all transform quality statuses, paired missingness (expected zero for valid rows), and order balance first. For the primary paired ordinal outcome, report the complete -4..4 delta distribution, median and mean paired difference, and an uncertainty interval appropriate to the observed N; use a two-sided exact sign test only as a secondary inferential summary when nonzero pairs exist. Do not dichotomize ratings.

Treat the three non-primary paired ratings as exploratory, label them as such, and either avoid p-values or control the stated familywise/FDR procedure before inspecting results. Report effect sizes and uncertainty before any p-values. Do not generalize a fixed-treatment within-study result beyond this simulated notice context.

If qualitative work is later authorized, access `responses_restricted_text` only through the restricted workgroup, retain data there, use a written blinded codebook with two authorized coders, record agreement and adjudication, and publish only de-identified aggregate themes/quoted excerpts after privacy review. Do not export or display raw text in this repository or analysis logs.
