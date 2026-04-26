-- Add a flag_url column to raw_sunroof_state and populate it with stable
-- Wikimedia Commons Special:FilePath URLs for all 50 states + DC.
--
-- These URLs are 302 redirects to the current canonical file location, so
-- they keep working when a flag gets renamed or replaced (e.g. Minnesota
-- 2024, Utah 2024, Mississippi 2021). Append `?width=<px>` for thumbnails.
--
-- Puerto Rico municipios in raw_sunroof_state get the Puerto Rico flag.
-- Anything else (unexpected non-state regions) falls through to NULL — the
-- UI is expected to handle NULL gracefully.

ALTER TABLE solargpt.raw_sunroof_state
  ADD COLUMN IF NOT EXISTS flag_url TEXT;

UPDATE solargpt.raw_sunroof_state SET flag_url = CASE state_name
  WHEN 'Alabama'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Alabama.svg'
  WHEN 'Alaska'               THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Alaska.svg'
  WHEN 'Arizona'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Arizona.svg'
  WHEN 'Arkansas'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Arkansas.svg'
  WHEN 'California'           THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_California.svg'
  WHEN 'Colorado'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Colorado.svg'
  WHEN 'Connecticut'          THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Connecticut.svg'
  WHEN 'Delaware'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Delaware.svg'
  WHEN 'Florida'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Florida.svg'
  WHEN 'Georgia'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Georgia_(U.S._state).svg'
  WHEN 'Hawaii'               THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Hawaii.svg'
  WHEN 'Idaho'                THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Idaho.svg'
  WHEN 'Illinois'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Illinois.svg'
  WHEN 'Indiana'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Indiana.svg'
  WHEN 'Iowa'                 THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Iowa.svg'
  WHEN 'Kansas'               THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kansas.svg'
  WHEN 'Kentucky'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Kentucky.svg'
  WHEN 'Louisiana'            THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Louisiana.svg'
  WHEN 'Maine'                THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Maine.svg'
  WHEN 'Maryland'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Maryland.svg'
  WHEN 'Massachusetts'        THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Massachusetts.svg'
  WHEN 'Michigan'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Michigan.svg'
  WHEN 'Minnesota'            THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Minnesota.svg'
  WHEN 'Mississippi'          THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Mississippi.svg'
  WHEN 'Missouri'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Missouri.svg'
  WHEN 'Montana'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Montana.svg'
  WHEN 'Nebraska'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Nebraska.svg'
  WHEN 'Nevada'               THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Nevada.svg'
  WHEN 'New Hampshire'        THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_New_Hampshire.svg'
  WHEN 'New Jersey'           THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_New_Jersey.svg'
  WHEN 'New Mexico'           THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_New_Mexico.svg'
  WHEN 'New York'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_New_York.svg'
  WHEN 'North Carolina'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_North_Carolina.svg'
  WHEN 'North Dakota'         THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_North_Dakota.svg'
  WHEN 'Ohio'                 THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Ohio.svg'
  WHEN 'Oklahoma'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Oklahoma.svg'
  WHEN 'Oregon'               THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Oregon.svg'
  WHEN 'Pennsylvania'         THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Pennsylvania.svg'
  WHEN 'Rhode Island'         THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Rhode_Island.svg'
  WHEN 'South Carolina'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_South_Carolina.svg'
  WHEN 'South Dakota'         THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_South_Dakota.svg'
  WHEN 'Tennessee'            THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Tennessee.svg'
  WHEN 'Texas'                THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Texas.svg'
  WHEN 'Utah'                 THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Utah.svg'
  WHEN 'Vermont'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Vermont.svg'
  WHEN 'Virginia'             THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Virginia.svg'
  WHEN 'Washington'           THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Washington.svg'
  WHEN 'West Virginia'        THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_West_Virginia.svg'
  WHEN 'Wisconsin'            THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Wisconsin.svg'
  WHEN 'Wyoming'              THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Wyoming.svg'
  WHEN 'District of Columbia' THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_District_of_Columbia.svg'
  ELSE NULL
END;

-- Puerto Rico municipios in raw_sunroof_state share the PR flag.
UPDATE solargpt.raw_sunroof_state
  SET flag_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Puerto_Rico.svg'
  WHERE flag_url IS NULL
    AND state_name IN (
      'Aguadilla','Aguada','Añasco','Arecibo','Bayamón','Cabo Rojo','Caguas',
      'Camuy','Carolina','Cataño','Cayey','Ceiba','Ciales','Cidra','Coamo',
      'Comerío','Corozal','Culebra','Dorado','Fajardo'
    );

-- v_state_kpis selects from raw_sunroof_state via `s.*`, so flag_url surfaces
-- automatically once the column exists. Re-run the existing CREATE OR REPLACE
-- VIEW v_state_kpis statement to refresh the view's column list.
