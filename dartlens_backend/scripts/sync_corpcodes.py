# 파일: PROTO/dartlens_backend/scripts/sync_corpcodes.py
# 주요 변경: DB 접속 환경변수 접두어를 MYSQL_*로 통일

#!/usr/bin/env python3
# CORPCODE.zip → CORPCODE.xml 파싱 → 상장사만 JSON 저장 → corp_basic_stage UPSERT
import json, os, re, sys, zipfile, io, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
import pymysql

ROOT = Path(__file__).resolve().parents[1]  # dartlens_backend/
load_dotenv(ROOT / ".env")

API_KEY = os.getenv("DART_API_KEY")
if not API_KEY:
    print("DART_API_KEY 환경변수가 필요합니다.", file=sys.stderr)
    sys.exit(1)

URL = f"https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key={API_KEY}"
OUT_JSON = Path(__file__).with_name("corpcodes_listed.json")

def fetch_zip(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()

def parse_xml_from_zip(buf: bytes) -> list[dict]:
    with zipfile.ZipFile(io.BytesIO(buf)) as zf:
        names = [n for n in zf.namelist() if re.search(r"CORPCODE\.xml$", n, re.I)]
        if not names:
            raise RuntimeError("CORPCODE.xml 없음")
        with zf.open(names[0]) as f:
            xml = f.read()
    root = ET.fromstring(xml)
    items = []
    for el in root.iter("list"):
        corp_code = (el.findtext("corp_code") or "").strip()
        corp_name = (el.findtext("corp_name") or "").strip()
        stock_code = (el.findtext("stock_code") or "").strip()
        # 상장사만 채택: stock_code 6자리 존재
        if re.fullmatch(r"\d{8}", corp_code) and re.fullmatch(r"\d{6}", stock_code or ""):
            items.append({
                "corp_code": corp_code,
                "corp_name": corp_name,
                "stock_code": stock_code,
                "listed": 1
            })
    return items

def upsert_db(items):
    host = os.getenv("MYSQL_HOST", "127.0.0.1")
    port = int(os.getenv("MYSQL_PORT", "3306"))
    user = os.getenv("MYSQL_USER", "root")
    passwd = os.getenv("MYSQL_PASSWORD", "")
    dbname = os.getenv("MYSQL_DB", "dartlens")

    conn = pymysql.connect(
        host=host, port=port, user=user, password=passwd,
        database=dbname, charset="utf8mb4", autocommit=True
    )
    cur = conn.cursor()

    sql_upsert = """
    INSERT INTO corp_basic_stage (corp_code, corp_name, stock_code, listed, updated_at)
    VALUES (%s, %s, %s, 1, NOW())
    ON DUPLICATE KEY UPDATE
      corp_name = VALUES(corp_name),
      stock_code = VALUES(stock_code),
      listed = 1,
      updated_at = NOW()
    """

    batch = []
    for it in items:
        cc = it.get("corp_code") or ""
        nm = it.get("corp_name") or ""
        sc = it.get("stock_code") or None
        if len(cc) == 8 and nm:
            batch.append((cc, nm, sc))

    for row in batch:
        cur.execute(sql_upsert, row)

    # JSON에 없는 상장코드 정리
    cur.execute("SELECT corp_code FROM corp_basic_stage WHERE listed=1")
    db_codes = {r[0] for r in cur.fetchall()}
    json_codes = {it["corp_code"] for it in items if "corp_code" in it}
    to_delete = list(db_codes - json_codes)
    if to_delete:
        cur.executemany("DELETE FROM corp_basic_stage WHERE corp_code=%s", [(x,) for x in to_delete])

    cur.close()
    conn.close()
    return len(batch), len(to_delete)

def main():
    buf = fetch_zip(URL)
    items = parse_xml_from_zip(buf)
    payload = {
        "generated_at": datetime.now(timezone(timedelta(hours=9))).isoformat(),
        "count": len(items),
        "items": sorted(items, key=lambda x: (x["corp_name"], x["corp_code"]))
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[json] {OUT_JSON} written. count={payload['count']}")

    up, deleted = upsert_db(payload["items"])
    print(f"[db] corp_basic_stage upsert={up}, delete={deleted}")

if __name__ == "__main__":
    main()
