"""One-shot migration runner for Jeff's JP Supabase project.

Applies pending migrations (0002_wholesale_applications.sql, 0004_wholesale_accounts.sql)
against iyvktystdlbqcnzkkooq via direct Postgres connection. Password read from argv
or PGPASSWORD env var — never logged.

Usage:
    python run_pending_migrations.py <db_password>

Safe to re-run: each migration runs in its own transaction; if the tables already exist,
the CREATE statements will error and roll back that migration. Output reports which
statements succeeded and which were already-present.
"""
import os
import re
import sys
from pathlib import Path

import pg8000.native

MIGRATIONS_DIR = Path(__file__).parent / "migrations"
PENDING = ["0002_wholesale_applications.sql", "0004_wholesale_accounts.sql"]

PROJECT_REF = "iyvktystdlbqcnzkkooq"
HOST_DIRECT = f"db.{PROJECT_REF}.supabase.co"
# Resolved 2026-04-21 via region probe — project lives in aws-1-us-east-1.
HOST_POOLER = "aws-1-us-east-1.pooler.supabase.com"


def connect(password: str):
    """Try direct host first (IPv6 often issues on Windows), then pooler session mode."""
    errors = []
    for host, port, user in (
        (HOST_DIRECT, 5432, "postgres"),
        (HOST_POOLER, 5432, f"postgres.{PROJECT_REF}"),
    ):
        try:
            conn = pg8000.native.Connection(
                user=user,
                password=password,
                host=host,
                port=port,
                database="postgres",
                ssl_context=True,
                timeout=15,
            )
            print(f"[connected] {host}:{port} as {user}")
            return conn
        except Exception as e:
            errors.append(f"{host}:{port} — {type(e).__name__}: {e}")
    raise RuntimeError("All connection attempts failed:\n  " + "\n  ".join(errors))


def split_statements(sql: str):
    """Split a SQL script on semicolons at statement-end, ignoring ones inside
    dollar-quoted function bodies ($$...$$). Naive but sufficient for the two
    migrations we run here — both use a single $$ pair per function."""
    out = []
    buf = []
    in_dollar = False
    for line in sql.splitlines():
        if "$$" in line:
            # toggle once per occurrence on the line
            in_dollar ^= (line.count("$$") % 2 == 1)
        buf.append(line)
        stripped = line.strip()
        if not in_dollar and stripped.endswith(";"):
            stmt = "\n".join(buf).strip()
            if stmt and not stmt.startswith("--"):
                out.append(stmt)
            buf = []
    tail = "\n".join(buf).strip()
    if tail and not tail.startswith("--"):
        out.append(tail)
    return out


def apply_migration(conn, name: str, sql: str):
    print(f"\n=== {name} ===")
    stmts = split_statements(sql)
    print(f"  {len(stmts)} statements")
    try:
        conn.run("BEGIN")
        for i, stmt in enumerate(stmts, 1):
            head = re.sub(r"\s+", " ", stmt)[:70]
            try:
                conn.run(stmt)
                print(f"  [{i:02d}] OK   {head}")
            except Exception as e:
                msg = str(e).lower()
                if "already exists" in msg or "duplicate" in msg:
                    print(f"  [{i:02d}] SKIP {head}  (already exists)")
                else:
                    print(f"  [{i:02d}] FAIL {head}\n       {type(e).__name__}: {e}")
                    conn.run("ROLLBACK")
                    return False
        conn.run("COMMIT")
        print(f"  >>> {name} COMMITTED")
        return True
    except Exception as e:
        print(f"  >>> FATAL: {type(e).__name__}: {e}")
        try:
            conn.run("ROLLBACK")
        except Exception:
            pass
        return False


def verify(conn):
    print("\n=== VERIFY ===")
    for tbl in ("wholesale_applications", "wholesale_accounts"):
        rows = conn.run(
            "select count(*) from information_schema.tables "
            "where table_schema='public' and table_name=:t",
            t=tbl,
        )
        exists = rows[0][0] > 0
        print(f"  {tbl}: {'EXISTS' if exists else 'MISSING'}")


def main():
    if len(sys.argv) < 2:
        pw = os.environ.get("PGPASSWORD")
        if not pw:
            print("Usage: python run_pending_migrations.py <db_password>")
            sys.exit(2)
    else:
        pw = sys.argv[1]

    conn = connect(pw)
    try:
        for name in PENDING:
            sql = (MIGRATIONS_DIR / name).read_text(encoding="utf-8")
            apply_migration(conn, name, sql)
        verify(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
