-- Switch v_state/county/city/zip_kpis to residential retail rates instead of
-- wholesale grid-marginal pricing. The wholesale price (Cambium
-- marginal_energy_usd_per_mwh, ~$30-45/MWh) was making median_payback_years
-- come out at 60-80 years. Residential customers offset retail bills, not
-- wholesale energy cost, so the math needs the EIA Form 826 residential rate.
--
-- v_gea_kpis is intentionally NOT changed — that view targets the data
-- center / utility audience and should keep using wholesale.

-- ── Lookup table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solargpt.eia_residential_retail_rates (
  state_code            text PRIMARY KEY,
  state_name            text NOT NULL UNIQUE,
  retail_usd_per_mwh    numeric NOT NULL,
  source                text,
  as_of_date            date
);

TRUNCATE solargpt.eia_residential_retail_rates;
INSERT INTO solargpt.eia_residential_retail_rates (state_code, state_name, retail_usd_per_mwh, source, as_of_date) VALUES
  ('AL','Alabama',152,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('AK','Alaska',247,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('AZ','Arizona',158,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('AR','Arkansas',134,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('CA','California',317,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('CO','Colorado',158,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('CT','Connecticut',326,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('DE','Delaware',161,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('DC','District of Columbia',175,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('FL','Florida',159,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('GA','Georgia',153,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('HI','Hawaii',416,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('ID','Idaho',119,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('IL','Illinois',175,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('IN','Indiana',165,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('IA','Iowa',145,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('KS','Kansas',152,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('KY','Kentucky',144,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('LA','Louisiana',134,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('ME','Maine',285,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MD','Maryland',197,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MA','Massachusetts',311,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MI','Michigan',200,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MN','Minnesota',161,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MS','Mississippi',144,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MO','Missouri',134,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('MT','Montana',130,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NE','Nebraska',116,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NV','Nevada',165,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NH','New Hampshire',269,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NJ','New Jersey',198,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NM','New Mexico',154,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NY','New York',234,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('NC','North Carolina',144,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('ND','North Dakota',116,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('OH','Ohio',168,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('OK','Oklahoma',134,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('OR','Oregon',134,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('PA','Pennsylvania',195,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('RI','Rhode Island',308,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('SC','South Carolina',156,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('SD','South Dakota',130,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('TN','Tennessee',134,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('TX','Texas',151,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('UT','Utah',116,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('VT','Vermont',215,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('VA','Virginia',162,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('WA','Washington',116,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('WV','West Virginia',152,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('WI','Wisconsin',175,'EIA Form 826, residential, May 2026','2026-05-01'),
  ('WY','Wyoming',121,'EIA Form 826, residential, May 2026','2026-05-01');

-- ── View definitions live in Neon ────────────────────────────────────────────
-- The four KPI views were updated via CREATE OR REPLACE in production.
-- Diff vs. prior: each base CTE now LEFT JOINs eia_residential_retail_rates
-- on state_name and exposes retail_usd_per_mwh; the SELECT side replaces
-- energy_usd_per_mwh with retail_usd_per_mwh in:
--   total_energy_value_usd_yr, untapped_energy_value_usd_yr,
--   untapped_annual_value_usd, untapped_lifetime_value_usd,
--   median_annual_savings_usd, median_lifetime_savings_usd,
--   median_payback_years (denominator).
--
-- v_gea_kpis is untouched.
