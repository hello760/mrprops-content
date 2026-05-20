"""
Shared helpers for .claude/tests/ verification scripts.

All scripts in this directory share these helpers so each script stays
small (<100 lines) and readable.
"""
import json
import sys
import urllib.request
from typing import Any

import os

SUPABASE_URL = "https://dfscqiffhwmjssxlltiz.supabase.co"
# Service role key — env var in CI; falls back to local secret only when running
# from a developer sandbox that already has the key. Never commit a hardcoded
# key to a public-facing repo (this file lives in mrprops-content which is
# private but still gets fetched by Vercel during build).
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY") or ""
if not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_SECRET_KEY env var not set. "
        "In CI: add SUPABASE_SECRET_KEY to GitHub Secrets. "
        "Locally: export SUPABASE_SECRET_KEY=<sb_secret_...>"
    )

HDR = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
}


def sb_get(path: str) -> Any:
    """GET against Supabase PostgREST. Returns parsed JSON or raises."""
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=HDR)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def find_repo_root() -> str:
    """Locate the cloned market-me-good repo across sandbox layouts.

    Resolution order:
      1. MMG_REPO_ROOT env var (explicit override).
      2. /tmp/repos/market-me-good (current canonical, used by all sessions
         from 2026-04-26 onward).
      3. /tmp/openclaw-workspace/market-me-good (older clone path).
      4. /sessions/<id>/market-me-good (where preflight.py originally looked).

    Returns the first existing path. Raises a clear error if none exist —
    most verifier scripts should fail loudly when the repo isn't cloned.
    """
    import os
    candidates = []
    env = os.environ.get("MMG_REPO_ROOT")
    if env:
        candidates.append(env)
    # 2026-05-15: prefer the per-session working tree FIRST (it has the
    # operator's latest committed/pulled state), then fall back to the
    # shared /tmp clones which can go stale or get permission-locked
    # under nobody:nogroup ownership across sessions.
    if os.path.isdir("/sessions"):
        for entry in os.listdir("/sessions"):
            session_root = os.path.join("/sessions", entry)
            # The MMG working tree historically named market-me-good, then
            # mmg-wrk from 2026-05 onward. Check both.
            for name in ("mmg-wrk", "market-me-good"):
                candidates.append(os.path.join(session_root, name))
    # Legacy /tmp clones as last resort
    candidates.extend([
        "/tmp/repos/market-me-good",
        "/tmp/openclaw-workspace/market-me-good",
    ])
    # First candidate that is a git repo wins (presence of .git ensures we
    # don't return a stale empty dir or a partial checkout).
    for c in candidates:
        if os.path.isdir(c) and os.path.isdir(os.path.join(c, ".git")):
            return c
    # Fallback to plain isdir if no candidate had .git (e.g. shallow CI tree)
    for c in candidates:
        if os.path.isdir(c):
            return c
    raise RuntimeError(
        f"market-me-good repo not found. Checked: {candidates}. "
        f"Set MMG_REPO_ROOT or clone to /tmp/repos/market-me-good."
    )


# ---- verdict primitives -------------------------------------------------

class Verdict:
    """Accumulator for a verification run."""
    def __init__(self, name: str):
        self.name = name
        self.checks: list[tuple[str, bool, str]] = []

    def ok(self, label: str, detail: str = '') -> None:
        self.checks.append((label, True, detail))

    def fail(self, label: str, detail: str = '') -> None:
        self.checks.append((label, False, detail))

    def report(self) -> int:
        """Print pass/fail table. Return 0 if all passed, 1 if any failed."""
        print(f"\n=== {self.name} ===")
        any_fail = False
        for label, passed, detail in self.checks:
            icon = '✓' if passed else '✗'
            line = f"  {icon} {label}"
            if detail:
                line += f"  — {detail}"
            print(line)
            if not passed:
                any_fail = True
        summary = 'PASS' if not any_fail else 'FAIL'
        print(f"  [{summary}]  {sum(1 for _,p,_ in self.checks if p)}/{len(self.checks)} checks passed")
        return 1 if any_fail else 0


def run(func):
    """Entry-point decorator: call func, propagate its Verdict exit code."""
    def wrapped():
        v = func()
        sys.exit(v.report() if isinstance(v, Verdict) else 0)
    return wrapped
