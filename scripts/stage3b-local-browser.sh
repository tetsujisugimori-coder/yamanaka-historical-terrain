#!/usr/bin/env bash
# Opt-in local recovery launcher. No install, global setting change, or evidence deletion.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${BROWSER_ROOT:?Set BROWSER_ROOT to the existing Playwright browser directory}"
: "${WEBKIT_LIB_DIR:?Set WEBKIT_LIB_DIR to the existing local dependency directory}"
RUNTIME="${STAGE3B_RUNTIME:-$ROOT/../stage3b-runtime}"
mkdir -p "$RUNTIME/temp" "$RUNTIME/evidence"
export TMPDIR="$RUNTIME/temp"
export PLAYWRIGHT_BROWSERS_PATH="$BROWSER_ROOT"
export STAGE3B_WPE_ROOT="$BROWSER_ROOT/webkit-2215/minibrowser-wpe"
export WEBKIT_LIB_DIR
if [[ ! -x "$STAGE3B_WPE_ROOT/bin/MiniBrowser" ]]; then echo 'Expected installed WebKit 2215 binary unavailable' >&2; exit 1; fi
cat > "$RUNTIME/webkit-local.sh" <<'SH'
#!/bin/sh
export WEBKIT_EXEC_PATH="$STAGE3B_WPE_ROOT/bin"
export WEBKIT_INJECTED_BUNDLE_PATH="$STAGE3B_WPE_ROOT/lib"
export WEBKIT_INSPECTOR_RESOURCES_PATH="$STAGE3B_WPE_ROOT/share"
export LD_LIBRARY_PATH="$STAGE3B_WPE_ROOT/lib:$STAGE3B_WPE_ROOT/sys/lib:$WEBKIT_LIB_DIR"
exec "$STAGE3B_WPE_ROOT/bin/MiniBrowser" "$@"
SH
chmod +x "$RUNTIME/webkit-local.sh"
export WEBKIT_EXECUTABLE="$RUNTIME/webkit-local.sh"
export EVIDENCE_DIR="${EVIDENCE_DIR:-$RUNTIME/evidence}"
cd "$ROOT"
# Serve the already verified build separately; this launcher does not alter it.
node scripts/stage3b-overview-browser.mjs
