#!/usr/bin/env python3
"""Apply 0005_website_analytics.sql to Supabase via Chrome SQL editor automation.

Stack (per memory rules):
  1. uiautomation to find + focus the Chrome SQL editor window
  2. pyperclip for SQL payload (clipboard)
  3. pyautogui for keystrokes (Ctrl+A, Delete, Ctrl+V, Ctrl+Enter)
  4. REST verification via urllib (service-role key) — real proof of success
"""
from __future__ import annotations

import os
import sys
import time
import json
import http.client
import urllib.parse
from pathlib import Path

# --- paths -------------------------------------------------------------------
ROOT = Path(r"c:/Projects/1.1 - A - AI AGENT EMPLOYEE 1 TASKS")
SQL_PATH = ROOT / "03 - JIMMY POTTERS BUSINESS SCALE/website/supabase/migrations/0005_website_analytics.sql"
ENV_PATH = ROOT / "03 - JIMMY POTTERS BUSINESS SCALE/website/.env.local"
SNAP_DIR = ROOT / "74 - VOICE MODE MCP"
SHOT_PATH = ROOT / "03 - JIMMY POTTERS BUSINESS SCALE/website/supabase/_diag_chrome.png"
FALLBACK_SQL = Path("/tmp/apply_0005.sql")

PROJECT_REF = "iyvktystdlbqcnzkkooq"
PROJECT_HOST = f"{PROJECT_REF}.supabase.co"

sys.path.insert(0, str(SNAP_DIR))

def log(msg: str):
    print(f"[apply-0005] {msg}", flush=True)


def load_service_key() -> str:
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("SUPABASE_SERVICE_ROLE_KEY not found in .env.local")


# --- REST helpers -----------------------------------------------------------
def rest_count(table: str, key: str, extra_query: str = "") -> tuple[int | None, str]:
    """Return (count, raw_content_range). count is None on error."""
    path = f"/rest/v1/{table}?select=*{('&' + extra_query) if extra_query else ''}"
    conn = http.client.HTTPSConnection(PROJECT_HOST, timeout=20)
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "count=exact",
        "Range-Unit": "items",
        "Range": "0-0",
    }
    conn.request("GET", path, headers=headers)
    resp = conn.getresponse()
    body = resp.read().decode("utf-8", errors="replace")
    cr = resp.getheader("Content-Range", "")
    conn.close()
    if resp.status >= 400:
        return None, f"HTTP {resp.status}: {body[:200]}"
    # Content-Range: 0-0/TOTAL  or */0
    total: int | None = None
    if "/" in cr:
        tail = cr.split("/")[-1].strip()
        if tail.isdigit():
            total = int(tail)
    return total, cr


def unique_visitor_count(key: str) -> int | None:
    """Fetch visitor_id list and dedupe. Skip if table not present."""
    conn = http.client.HTTPSConnection(PROJECT_HOST, timeout=20)
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }
    conn.request("GET", "/rest/v1/website_sessions?select=visitor_id&limit=100000", headers=headers)
    resp = conn.getresponse()
    body = resp.read().decode("utf-8", errors="replace")
    conn.close()
    if resp.status >= 400:
        return None
    try:
        rows = json.loads(body)
    except json.JSONDecodeError:
        return None
    return len({r.get("visitor_id") for r in rows if r.get("visitor_id") is not None})


def bot_count(key: str) -> int | None:
    total, _ = rest_count("website_sessions", key, "is_bot=eq.true")
    return total


def tables_ready(key: str) -> bool:
    """Probe all three analytics tables."""
    for t in ("website_sessions", "website_page_views", "website_events"):
        c, info = rest_count(t, key)
        if c is None:
            log(f"probe {t} -> NOT READY ({info})")
            return False
        log(f"probe {t} -> OK (count={c})")
    return True


# --- Chrome automation ------------------------------------------------------
def find_chrome_sql_window():
    import uiautomation as auto
    import win32gui

    # Enumerate top-level windows
    candidates = []

    def cb(hwnd, _):
        if not win32gui.IsWindowVisible(hwnd):
            return True
        title = win32gui.GetWindowText(hwnd) or ""
        cls = win32gui.GetClassName(hwnd) or ""
        if "Chrome" not in cls and "chrome" not in cls.lower():
            return True
        if "SQL" in title and "Supabase" in title:
            candidates.append((hwnd, title))
        elif "Supabase" in title and "SQL" in title.upper():
            candidates.append((hwnd, title))
        return True

    win32gui.EnumWindows(cb, None)
    if candidates:
        log(f"Found {len(candidates)} matching Chrome SQL tab window(s).")
        for h, t in candidates:
            log(f"  hwnd={h}  title={t!r}")
        return candidates[0][0]

    # Fallback: any Chrome window with 'Supabase' title
    fallback = []
    def cb2(hwnd, _):
        if not win32gui.IsWindowVisible(hwnd):
            return True
        title = win32gui.GetWindowText(hwnd) or ""
        cls = win32gui.GetClassName(hwnd) or ""
        if ("Chrome" in cls or "chrome" in cls.lower()) and "Supabase" in title:
            fallback.append((hwnd, title))
        return True

    win32gui.EnumWindows(cb2, None)
    if fallback:
        log(f"Fallback: {len(fallback)} Chrome Supabase window(s).")
        for h, t in fallback:
            log(f"  hwnd={h}  title={t!r}")
        return fallback[0][0]

    return None


def focus_and_maximize(hwnd):
    try:
        import snap_layout
        snap_layout.ensure_maximized_on_primary(hwnd)
        log("ensure_maximized_on_primary OK")
        return True
    except Exception as e:
        log(f"snap_layout failed: {e!r}; falling back to ShowWindow")
        import win32gui, win32con
        try:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
            win32gui.SetForegroundWindow(hwnd)
            return True
        except Exception as e2:
            log(f"fallback focus failed: {e2!r}")
            return False


def diag_shot(hwnd):
    try:
        import snap_layout
        snap_layout.capture_hwnd(hwnd, str(SHOT_PATH))
        log(f"PrintWindow diag shot -> {SHOT_PATH}")
        return SHOT_PATH
    except Exception as e:
        log(f"capture_hwnd failed: {e!r}")
        return None


def trash_shot(path):
    if path and path.exists():
        try:
            from send2trash import send2trash
            send2trash(str(path))
            log(f"send2trash diag shot {path.name}")
        except Exception as e:
            log(f"send2trash failed: {e!r}")


def click_editor_center(hwnd):
    """Click ~center of the editor pane. Monaco editor dominates center-right of SQL editor."""
    import win32gui, pyautogui
    rect = win32gui.GetWindowRect(hwnd)
    l, t, r, b = rect
    # SQL editor pane is roughly center of the viewport, skew slightly right of middle
    # to avoid the left project sidebar. Content area begins ~280px from left.
    cx = (l + r) // 2 + 100
    cy = (t + b) // 2 - 50  # upper half where editor lives, below tabs
    log(f"Clicking editor center ~({cx},{cy}) window rect={rect}")
    pyautogui.click(cx, cy)
    time.sleep(0.4)
    # One more click to ensure focus
    pyautogui.click(cx, cy)
    time.sleep(0.3)


def apply_migration(sql_text: str, hwnd) -> bool:
    import pyperclip, pyautogui

    pyautogui.FAILSAFE = False

    # Load clipboard
    pyperclip.copy(sql_text)
    time.sleep(0.3)
    got = pyperclip.paste()
    if len(got) != len(sql_text):
        log(f"WARN: clipboard length {len(got)} != source {len(sql_text)}; retrying")
        pyperclip.copy(sql_text)
        time.sleep(0.5)
        got = pyperclip.paste()
        if len(got) < len(sql_text) - 5:
            log(f"Clipboard mismatch persists (got {len(got)}). Aborting GUI path.")
            return False
    log(f"Clipboard loaded ({len(sql_text)} chars).")

    # Focus editor
    click_editor_center(hwnd)

    # Select all + delete + paste
    pyautogui.hotkey("ctrl", "a")
    time.sleep(0.2)
    pyautogui.press("delete")
    time.sleep(0.3)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(1.2)  # Monaco needs a beat to render large paste

    # Run
    pyautogui.hotkey("ctrl", "enter")
    log("Sent Ctrl+Enter to run migration.")
    return True


def try_run_button_via_uia(hwnd) -> bool:
    """Fallback: walk Chrome UIA tree and click Run button."""
    try:
        import uiautomation as auto
        win = auto.ControlFromHandle(hwnd)
        if not win:
            return False
        # Search for a button named Run / RUN
        btn = win.ButtonControl(searchDepth=30, Name="Run")
        if btn.Exists(maxSearchSeconds=2):
            btn.Click()
            log("Clicked Run button via UIA.")
            return True
        # Case-insensitive search
        def finder(c, d):
            try:
                n = (c.Name or "").strip().lower()
                return n in ("run", "run ctrl+enter")
            except Exception:
                return False
        for child in win.GetChildren():
            pass  # exhaustive tree walk is slow; the named match above covers Supabase's button
        return False
    except Exception as e:
        log(f"UIA run-button path failed: {e!r}")
        return False


def main():
    log(f"Reading migration: {SQL_PATH}")
    sql_text = SQL_PATH.read_text(encoding="utf-8")
    log(f"Migration size: {len(sql_text)} chars / {sql_text.count(chr(10)) + 1} lines")

    key = load_service_key()
    log(f"Service key loaded (len={len(key)}).")

    # Shortcut: maybe it's already applied from a prior run
    log("Pre-check: are analytics tables already present?")
    if tables_ready(key):
        log("All three analytics tables already exist. Skipping GUI apply.")
        return report(key, already_applied=True)

    # Find Chrome window
    hwnd = find_chrome_sql_window()
    if not hwnd:
        log("Could not find Chrome SQL tab. Opening one.")
        import subprocess
        subprocess.Popen([
            "cmd", "/c", "start", "", "chrome.exe", "--new-window",
            f"https://supabase.com/dashboard/project/{PROJECT_REF}/sql/new",
        ])
        time.sleep(7)
        hwnd = find_chrome_sql_window()
        if not hwnd:
            log("Still no Chrome SQL window. Writing fallback SQL and aborting.")
            FALLBACK_SQL.write_text(sql_text, encoding="utf-8")
            print(f"\nFALLBACK: paste {FALLBACK_SQL} into Supabase manually.")
            return 2

    # Focus + maximize on primary
    focus_and_maximize(hwnd)
    time.sleep(1.0)
    shot = diag_shot(hwnd)

    attempt = 0
    ok = False
    while attempt < 3:
        attempt += 1
        log(f"=== Attempt {attempt}/3 ===")
        apply_migration(sql_text, hwnd)
        # Supabase takes a few seconds to run 205 lines + create indexes
        time.sleep(6.5)
        if tables_ready(key):
            ok = True
            break
        log(f"Tables not ready after attempt {attempt}; will retry / try Run button.")
        if attempt == 2:
            # Try clicking the Run button explicitly
            try_run_button_via_uia(hwnd)
            time.sleep(6.5)
            if tables_ready(key):
                ok = True
                break

    # Cleanup diag screenshot (Rule #25)
    trash_shot(shot)

    if not ok:
        log("Migration did NOT take after 3 attempts.")
        FALLBACK_SQL.write_text(sql_text, encoding="utf-8")
        print(f"\nFALLBACK: paste {FALLBACK_SQL} into Supabase manually.")
        return 3

    return report(key, already_applied=False)


def report(key: str, already_applied: bool) -> int:
    sess_total, sess_cr = rest_count("website_sessions", key)
    pv_total, _ = rest_count("website_page_views", key)
    ev_total, _ = rest_count("website_events", key)
    bots = bot_count(key)
    uniq = unique_visitor_count(key)

    print("\n" + "=" * 60)
    print(" JIMMY POTTERS WEBSITE ANALYTICS — 0005 APPLIED")
    print("=" * 60)
    status = "already present" if already_applied else "APPLIED"
    print(f" Migration status: {status}")
    print(f" Total sessions:   {sess_total}")
    print(f" Unique visitors:  {uniq}")
    print(f" Total pageviews:  {pv_total}")
    print(f" Events fired:     {ev_total}")
    print(f" Filtered-out bots: {bots}")
    print(" Note: Products are test-mode — baseline traffic only.")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
