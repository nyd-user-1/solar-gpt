-- Add seal_url column to raw_sunroof_county and populate for the 34 NY counties
-- in Project Sunroof data.  Seals are sourced from Wikimedia Commons
-- Special:FilePath redirect URLs (stable, SVG).
--
-- After running this script:
--   1. Re-run the CREATE OR REPLACE VIEW solargpt.v_county_kpis statement
--      so the view's column list picks up the new seal_url column.
--   2. Verify: SELECT region_name, seal_url FROM solargpt.v_county_kpis
--              WHERE state_name = 'New York' ORDER BY region_name;

-- Step 1: add the column
ALTER TABLE solargpt.raw_sunroof_county
  ADD COLUMN IF NOT EXISTS seal_url TEXT;

-- Step 2: populate for NY counties (guardrailed to state_name = 'New York')
UPDATE solargpt.raw_sunroof_county SET seal_url = CASE region_name
  WHEN 'Albany County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Albany_County,_New_York.svg'
  WHEN 'Bronx County'        THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Bronx_County,_New_York.svg'
  WHEN 'Broome County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Broome_County,_New_York.svg'
  WHEN 'Cayuga County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Cayuga_County,_New_York.svg'
  WHEN 'Clinton County'      THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Clinton_County,_New_York.svg'
  WHEN 'Dutchess County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Dutchess_County,_New_York.svg'
  WHEN 'Erie County'         THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Erie_County,_New_York.svg'
  WHEN 'Herkimer County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Herkimer_County,_New_York.svg'
  WHEN 'Jefferson County'    THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Jefferson_County,_New_York.svg'
  WHEN 'Kings County'        THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Kings_County,_New_York.svg'
  WHEN 'Madison County'      THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Madison_County,_New_York.svg'
  WHEN 'Monroe County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Monroe_County,_New_York.svg'
  WHEN 'Nassau County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Nassau_County,_New_York.svg'
  WHEN 'New York County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_New_York_County,_New_York.svg'
  WHEN 'Niagara County'      THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Niagara_County,_New_York.svg'
  WHEN 'Oneida County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Oneida_County,_New_York.svg'
  WHEN 'Onondaga County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Onondaga_County,_New_York.svg'
  WHEN 'Ontario County'      THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Ontario_County,_New_York.svg'
  WHEN 'Orange County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Orange_County,_New_York.svg'
  WHEN 'Oswego County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Oswego_County,_New_York.svg'
  WHEN 'Putnam County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Putnam_County,_New_York.svg'
  WHEN 'Queens County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Queens_County,_New_York.svg'
  WHEN 'Rensselaer County'   THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Rensselaer_County,_New_York.svg'
  WHEN 'Richmond County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Richmond_County,_New_York.svg'
  WHEN 'Rockland County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Rockland_County,_New_York.svg'
  WHEN 'Saratoga County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Saratoga_County,_New_York.svg'
  WHEN 'Schenectady County'  THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Schenectady_County,_New_York.svg'
  WHEN 'Suffolk County'      THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Suffolk_County,_New_York.svg'
  WHEN 'Tioga County'        THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Tioga_County,_New_York.svg'
  WHEN 'Tompkins County'     THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Tompkins_County,_New_York.svg'
  WHEN 'Ulster County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Ulster_County,_New_York.svg'
  WHEN 'Warren County'       THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Warren_County,_New_York.svg'
  WHEN 'Washington County'   THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Washington_County,_New_York.svg'
  WHEN 'Westchester County'  THEN 'https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Westchester_County,_New_York.svg'
  ELSE seal_url   -- preserve any existing values
END
WHERE state_name = 'New York';

-- Step 3 (manual — run in Neon after this script):
-- Re-run the CREATE OR REPLACE VIEW solargpt.v_county_kpis statement
-- so Postgres refreshes the view's column list and seal_url becomes visible.
--
-- Verify:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'solargpt' AND table_name = 'v_county_kpis'
--   AND column_name = 'seal_url';
