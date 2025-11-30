# first install tabulate
import sqlite3
import json
from pathlib import Path
from tabulate import tabulate

DB_PATH = Path("D:/Internship/final_project/construction_projects_management/backend/data/predictions.db")

def get_rows(conn, table):
    """Fetch rows + convert JSON fields"""
    cursor = conn.execute(f"SELECT * FROM {table} ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()
    cols = [description[0] for description in cursor.description]
    return cols, rows

def clean_json(val):
    """Convert JSON to short string"""
    if not isinstance(val, str):
        return val
    if val.startswith("{") or val.startswith("["):
        try:
            return json.dumps(json.loads(val), indent=2)[:120] + " ..."
        except:
            return val
    return val

def print_clean_delay(rows, cols):
    """Pretty formatted summary table for delay predictions"""
    display_data = []
    for row in rows:
        r = dict(zip(cols, row))
        display_data.append([
            r["id"],
            r["created_at"],
            "Yes" if r["is_delayed"] else "No",
            f"{r['delay_probability']*100:.1f}%",
            r["predicted_delay_days"],
            r["risk_level"],
            r["confidence"],
            r["districttype"],
            r["final_project_type"],
        ])
    print(tabulate(
        display_data,
        headers=["ID","Timestamp","Delayed","Prob","Days","Risk","Conf","District","Type"],
        tablefmt="fancy_grid"
    ))

def print_clean_cost(rows, cols):
    """Pretty formatted summary table for cost predictions"""
    display_data = []
    for row in rows:
        r = dict(zip(cols, row))
        display_data.append([
            r["id"],
            r["created_at"],
            r.get("risk_level"),
            clean_json(r.get("input_payload")),
            clean_json(r.get("output_payload"))
        ])
    print(tabulate(
        display_data,
        headers=["ID","Timestamp","Risk","Input","Output"],
        tablefmt="fancy_grid"
    ))

def main():
    if not DB_PATH.exists():
        print(f"❌ Database not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)

    print("\n==============================================")
    print("📌  CLEAN PREDICTIONS SUMMARY REPORT")
    print("==============================================")

    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"\n📋 Found Tables: {tables}")

    # ---------------- Delay Predictions ----------------
    print("\n\n================= ⏳ DELAY PREDICTIONS =================")
    if "delay_predictions" in tables:
        cols, rows = get_rows(conn, "delay_predictions")
        if rows:
            print_clean_delay(rows, cols)
        else:
            print("No delay predictions found.")
    else:
        print("delay_predictions table missing.")

    # ---------------- Cost Predictions ----------------
    print("\n\n================= 💰 COST PREDICTIONS =================")
    if "cost_predictions" in tables:
        cols, rows = get_rows(conn, "cost_predictions")
        if rows:
            print_clean_cost(rows, cols)
        else:
            print("No cost predictions found.")
    else:
        print("cost_predictions table missing.")

    conn.close()

if __name__ == "__main__":
    main()
