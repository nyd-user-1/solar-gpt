-- Optional optimized view for heatmap data.
-- The app currently queries v_zip_kpis directly with bounds filtering,
-- which is equivalent. Run this migration to pre-compute weight_normalized
-- as a stored view if query performance becomes an issue.

CREATE OR REPLACE VIEW solargpt.v_heatmap_points AS
SELECT
  state_name,
  zip_code,
  lat_avg,
  lng_avg,
  count_qualified,
  -- TODO: tune weight formula after visual review — may want LOG(count_qualified)
  -- to compress outliers like dense NYC ZIPs (100x building count of upstate ZIPs)
  count_qualified::float / NULLIF(MAX(count_qualified) OVER (), 0) AS weight_normalized
FROM solargpt.v_zip_kpis
WHERE lat_avg IS NOT NULL AND lng_avg IS NOT NULL;

-- Standard query pattern — always pass bounds to avoid pulling all 11k+ ZIPs:
--
-- SELECT lat_avg, lng_avg, weight_normalized
-- FROM solargpt.v_heatmap_points
-- WHERE lat_avg BETWEEN $lat_min AND $lat_max
--   AND lng_avg BETWEEN $lng_min AND $lng_max
-- LIMIT 5000;  -- safety ceiling
