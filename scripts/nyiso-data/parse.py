"""Parse NYISO interconnection queue xlsx files into JSON for Neon ingestion."""
import json
import re
from datetime import date, datetime
from pathlib import Path

import openpyxl

HERE = Path(__file__).parent

# (file, snapshot_date, sheet_name, status, header_rows, columns)
# columns is a list of (db_field, source_col_index_0_based) or special "split:county_state"
SOURCES = [
    {
        "file": "NYISO-2026-03-31.xlsx",
        "snapshot": "2026-03-31",
        "sheet": "Interconnection Queue",
        "status": "active",
        "header_rows": 1,
        "cols": {
            "queue_pos": 0, "developer": 1, "project_name": 2, "date_of_ir": 3,
            "sp_mw": 4, "wp_mw": 5, "type_fuel": 6,
            "energy_storage_capability": 7, "minimum_duration_full_discharge": 8,
            "county": 9, "state": 10, "zone": 11,
            "points_of_interconnection": 12, "utility": 13,
            "affected_transmission_owner": 14, "s": 15,
            "last_updated_date": 16, "availability_of_studies": 17,
            "ia_tender_date": 18, "cy_fs_complete_date": 19,
            "proposed_in_service_date": 20, "proposed_sync_date": 21,
            "proposed_cod": 22,
        },
    },
    {
        "file": "NYISO-2026-03-31.xlsx",
        "snapshot": "2026-03-31",
        "sheet": "Withdrawn",
        "status": "withdrawn",
        "header_rows": 1,
        "cols": {
            "queue_pos": 0, "developer": 1, "project_name": 2, "date_of_ir": 3,
            "sp_mw": 4, "wp_mw": 5, "type_fuel": 6,
            "county": 7, "state": 8, "zone": 9,
            "points_of_interconnection": 10, "utility": 11,
            "s": 12, "last_updated_date": 13,
        },
    },
    {
        "file": "NYISO-2026-03-31.xlsx",
        "snapshot": "2026-03-31",
        "sheet": "In Service",
        "status": "in_service",
        "header_rows": 2,
        "cols": {
            "queue_pos": 0, "developer": 1, "project_name": 2, "date_of_ir": 3,
            "sp_mw": 4, "wp_mw": 5, "type_fuel": 6,
            "county": 7, "state": 8, "zone": 9,
            "points_of_interconnection": 10, "utility": 11,
            "s": 12, "last_updated_date": 13,
            "availability_of_studies": 14,
            "proposed_in_service_date": 15, "proposed_cod": 16,
        },
    },
    {
        "file": "NYISO-2019-05-31.xlsx",
        "snapshot": "2019-05-31",
        "sheet": "Active",
        "status": "active",
        "header_rows": 2,
        "cols": {
            "queue_pos": 0, "developer": 1, "project_name": 2, "date_of_ir": 3,
            "sp_mw": 4, "wp_mw": 5, "type_fuel": 6,
            "county_state_combined": 7, "zone": 8,
            "points_of_interconnection": 9, "utility": 10,
            "s": 11, "last_updated_date": 12,
            "availability_of_studies": 13, "cy_fs_complete_date": 14,
            "proposed_in_service_date": 15, "proposed_sync_date": 16,
            "proposed_cod": 17,
        },
    },
    {
        "file": "NYISO-2019-05-31.xlsx",
        "snapshot": "2019-05-31",
        "sheet": "Withdrawn",
        "status": "withdrawn",
        "header_rows": 2,
        "cols": {
            "queue_pos": 0, "developer": 1, "project_name": 2, "date_of_ir": 3,
            "sp_mw": 4, "wp_mw": 5, "type_fuel": 6,
            "county_state_combined": 7, "zone": 8,
            "points_of_interconnection": 9, "utility": 10,
            "s": 11, "last_updated_date": 12,
            "availability_of_studies": 13, "proposed_in_service_date": 14,
        },
    },
]

DATE_FIELDS = {
    "date_of_ir", "last_updated_date", "ia_tender_date",
    "cy_fs_complete_date",
}
NUMERIC_FIELDS = {"sp_mw", "wp_mw"}


def to_date(v):
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    if isinstance(v, str):
        s = v.strip()
        if not s or s.upper() in {"N/A", "NA", "TBD", "NONE"}:
            return None
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y/%m/%d"):
            try:
                return datetime.strptime(s, fmt).date().isoformat()
            except ValueError:
                pass
        return None
    return None


def to_num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip().replace(",", "")
        if not s or s.upper() in {"N/A", "NA", "TBD"}:
            return None
        try:
            return float(s)
        except ValueError:
            return None
    return None


def to_text(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    s = str(v).strip()
    return s if s else None


def split_county_state(combined):
    """'Cortland, NY' -> ('Cortland', 'NY'). 'Quebec - NY, NY' -> ('Quebec - NY', 'NY')."""
    if not combined:
        return None, None
    s = str(combined).strip()
    m = re.match(r"^(.*),\s*([A-Z]{2})$", s)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return s, None


def normalize_queue_pos(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return f"{int(v):04d}"
    s = str(v).strip()
    if not s:
        return None
    return s


def main():
    rows = []
    for src in SOURCES:
        wb = openpyxl.load_workbook(HERE / src["file"], data_only=True)
        ws = wb[src["sheet"]]
        start_row = src["header_rows"] + 1
        for r in range(start_row, ws.max_row + 1):
            raw_row = [ws.cell(r, c + 1).value for c in range(ws.max_column)]
            qp_raw = raw_row[src["cols"]["queue_pos"]] if src["cols"]["queue_pos"] < len(raw_row) else None
            qp = normalize_queue_pos(qp_raw)
            if not qp:
                continue
            rec = {
                "queue_pos": qp,
                "snapshot_date": src["snapshot"],
                "status": src["status"],
                "source_file": src["file"],
                "source_sheet": src["sheet"],
            }
            for field, idx in src["cols"].items():
                if field == "queue_pos":
                    continue
                val = raw_row[idx] if idx < len(raw_row) else None
                if field == "county_state_combined":
                    county, state = split_county_state(val)
                    rec["county"] = county
                    rec["state"] = state
                elif field in DATE_FIELDS:
                    rec[field] = to_date(val)
                elif field in NUMERIC_FIELDS:
                    rec[field] = to_num(val)
                else:
                    rec[field] = to_text(val)
            # raw json blob of original row
            rec["raw"] = {
                f"col_{i}": (
                    v.isoformat() if isinstance(v, (datetime, date)) else v
                )
                for i, v in enumerate(raw_row)
                if v is not None
            }
            rows.append(rec)
        print(f"  {src['file']} :: {src['sheet']} -> {sum(1 for x in rows if x['source_sheet']==src['sheet'] and x['snapshot_date']==src['snapshot'])} rows")

    # Dedup on (queue_pos, snapshot_date) — prefer status priority active > withdrawn > in_service
    priority = {"active": 0, "in_service": 1, "withdrawn": 2}
    seen = {}
    for r in rows:
        key = (r["queue_pos"], r["snapshot_date"])
        if key not in seen or priority[r["status"]] < priority[seen[key]["status"]]:
            seen[key] = r
    deduped = list(seen.values())
    print(f"\nTotal rows: {len(rows)}, after dedup: {len(deduped)}")

    out_path = HERE / "rows.json"
    with open(out_path, "w") as f:
        json.dump(deduped, f, default=str)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
