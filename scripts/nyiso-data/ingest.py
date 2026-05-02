import os, glob, psycopg2

DSN = os.environ["DATABASE_URL"]
conn = psycopg2.connect(DSN)
conn.autocommit = False
cur = conn.cursor()
files = sorted(glob.glob("b*.sql"))
print(f"Executing {len(files)} batches...", flush=True)
for f in files:
    sql = open(f).read()
    cur.execute(sql)
    print(f"  {f}: rowcount={cur.rowcount}", flush=True)
conn.commit()
cur.execute("SELECT count(*) FROM solargpt.raw_nyiso_queue")
print("Total rows:", cur.fetchone()[0], flush=True)
cur.execute("SELECT status, count(*) FROM solargpt.raw_nyiso_queue GROUP BY status ORDER BY status")
print("By status:", cur.fetchall(), flush=True)
cur.execute("SELECT snapshot_date, count(*) FROM solargpt.raw_nyiso_queue GROUP BY snapshot_date ORDER BY snapshot_date")
print("By snapshot:", cur.fetchall(), flush=True)
conn.close()
