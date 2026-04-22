"""
Primary-monitor-only apply of 0005_website_analytics.sql via the Supabase SQL
editor tab that Jeff already has signed into. Uses clipboard + pyautogui.
"""
from __future__ import annotations
import os, sys, time, subprocess, ctypes
from ctypes import wintypes
from pathlib import Path

WEBSITE = Path(r"c:/Projects/1.1 - A - AI AGENT EMPLOYEE 1 TASKS/03 - JIMMY POTTERS BUSINESS SCALE/website")
SQL_FILE = WEBSITE / "supabase/migrations/0005_website_analytics.sql"
ENV_FILE = WEBSITE / ".env.local"

def srk():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no service role key")

def table_exists() -> bool:
    import urllib.request
    k = srk()
    req = urllib.request.Request(
        "https://iyvktystdlbqcnzkkooq.supabase.co/rest/v1/website_sessions?select=visitor_id&limit=1",
        headers={"apikey": k, "Authorization": f"Bearer {k}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status in (200, 206)
    except Exception as e:
        return False

def primary_rect():
    user32 = ctypes.windll.user32
    return (0, 0, user32.GetSystemMetrics(0), user32.GetSystemMetrics(1))

def find_chrome_sql_editor():
    import uiautomation as auto
    for w in auto.GetRootControl().GetChildren():
        try:
            name = w.Name or ""
        except Exception:
            continue
        if "Chrome" in (w.ClassName or "") or "chrome" in name.lower():
            if ("SQL" in name or "sql" in name.lower()) and "Supabase" in name:
                return w
    # fallback: any Chrome with "Supabase"
    for w in auto.GetRootControl().GetChildren():
        name = w.Name or ""
        if "Supabase" in name and "Chrome" in (w.ClassName or ""):
            return w
    return None

def maximize_on_primary(hwnd: int):
    user32 = ctypes.windll.user32
    SW_RESTORE = 9
    SW_MAXIMIZE = 3
    # Move to (0,0) of primary, then maximize.
    user32.ShowWindow(hwnd, SW_RESTORE)
    l, t, r, b = primary_rect()
    user32.SetWindowPos(hwnd, 0, l, t, r - l, b - t, 0x0040)
    user32.ShowWindow(hwnd, SW_MAXIMIZE)
    user32.SetForegroundWindow(hwnd)

def main():
    if table_exists():
        print("ALREADY_APPLIED")
        return 0

    sql = SQL_FILE.read_text(encoding="utf-8")
    print(f"sql_bytes={len(sql)}")

    import pyperclip, pyautogui
    pyperclip.copy(sql)
    assert len(pyperclip.paste()) == len(sql), "clipboard mismatch"

    win = find_chrome_sql_editor()
    if win is None:
        print("CHROME_NOT_FOUND")
        return 2
    hwnd = win.NativeWindowHandle
    print(f"hwnd={hwnd} name={win.Name!r}")
    maximize_on_primary(hwnd)
    time.sleep(0.8)

    # Click center of primary monitor — Monaco editor fills most of it.
    l, t, r, b = primary_rect()
    cx, cy = (l + r) // 2, (t + b) // 2 + 60  # nudge down below top toolbar
    pyautogui.click(cx, cy)
    time.sleep(0.3)

    # Clear + paste + run
    pyautogui.hotkey("ctrl", "a"); time.sleep(0.15)
    pyautogui.press("delete");     time.sleep(0.2)
    pyautogui.hotkey("ctrl", "v"); time.sleep(1.2)
    pyautogui.hotkey("ctrl", "enter")
    print("DISPATCHED_RUN")

    # Poll REST up to 25s for table to appear.
    for i in range(25):
        time.sleep(1)
        if table_exists():
            print(f"APPLIED after {i+1}s")
            return 0
    print("TIMEOUT — tables still missing")
    return 3

if __name__ == "__main__":
    sys.exit(main())
