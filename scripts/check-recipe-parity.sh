#!/usr/bin/env bash
# check-recipe-parity.sh
#
# Verifies that src/lib/calculator-recipes.ts in this repo is byte-identical to
# the canonical source in market-me-good/src/lib/calculator-recipes.ts, ignoring
# the "MIRRORED FROM" header block.
#
# Canonical source resolution:
#   1. If ../market-me-good/src/lib/calculator-recipes.ts exists (local dev with
#      sibling checkout), use it.
#   2. Else if CI=true OR the file is missing locally, fetch from
#      raw.githubusercontent.com/hello760/market-me-good/main/...
#   3. Else print an informative error and exit non-zero.
#
# Exit codes:
#   0 — in parity (or skipped safely in local dev without sibling checkout)
#   1 — drift detected
#   2 — configuration error (cannot fetch canonical)

set -euo pipefail

MIRROR_PATH="src/lib/calculator-recipes.ts"
SIBLING_PATH="../market-me-good/src/lib/calculator-recipes.ts"
REMOTE_URL="https://raw.githubusercontent.com/hello760/market-me-good/main/src/lib/calculator-recipes.ts"

if [[ ! -f "$MIRROR_PATH" ]]; then
  echo "✗ parity check: mirror file $MIRROR_PATH does not exist in this repo"
  exit 2
fi

# Resolve canonical source
CANONICAL_TEMP=""
if [[ -f "$SIBLING_PATH" ]]; then
  CANONICAL_PATH="$SIBLING_PATH"
elif [[ "${CI:-false}" == "true" ]] || [[ "${FORCE_REMOTE:-false}" == "true" ]]; then
  CANONICAL_TEMP=$(mktemp)
  if ! curl -sfL "$REMOTE_URL" > "$CANONICAL_TEMP"; then
    echo "✗ parity check: failed to fetch canonical from $REMOTE_URL"
    rm -f "$CANONICAL_TEMP"
    exit 2
  fi
  CANONICAL_PATH="$CANONICAL_TEMP"
else
  # Local dev without sibling checkout — skip rather than fail, so local
  # scripts like `npm run lint` in this repo don't break on developer machines
  # that only have mrprops-content checked out.
  echo "ℹ parity check: sibling checkout not found and CI=false; skipping (set CI=true to force remote fetch)"
  exit 0
fi

# Compare, skipping mirror's 4-line "MIRRORED FROM" header block
# (3 comment lines + 1 blank separator). tail -n +5 strips them.
diff_output=$(diff <(cat "$CANONICAL_PATH") <(tail -n +5 "$MIRROR_PATH") || true)

if [[ -n "$CANONICAL_TEMP" ]]; then
  rm -f "$CANONICAL_TEMP"
fi

if [[ -z "$diff_output" ]]; then
  echo "✓ parity check: calculator-recipes.ts matches canonical"
  exit 0
else
  echo "✗ parity check: DRIFT detected between market-me-good (canonical) and this repo"
  echo "$diff_output" | head -40
  echo ""
  echo "To fix: copy the canonical file back into $MIRROR_PATH (keeping the 3-line MIRRORED header)."
  exit 1
fi
