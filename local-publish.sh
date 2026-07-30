#!/usr/bin/env bash
set -euo pipefail

VERDACCIO_URL="http://localhost:4873"

# Packages to build & publish (in dependency order)
PACKAGES=(
  "packages/core/ast"
  "packages/core/protocol"
  "packages/runtime/event-engine"
  "packages/runtime/state-engine"
  "packages/runtime/runtime-core"
  "packages/renderers/angular"
)

echo "=== GenUI Protocol — Publish to Verdaccio ==="

# 1. Start verdaccio if not running
if ! curl -s "$VERDACCIO_URL" > /dev/null 2>&1; then
  echo "[1/4] Starting verdaccio..."
  npx verdaccio &
  VERDACCIO_PID=$!
  echo "  Waiting for verdaccio to be ready..."
  for i in $(seq 1 30); do
    if curl -s "$VERDACCIO_URL" > /dev/null 2>&1; then
      echo "  Verdaccio ready at $VERDACCIO_URL"
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "  ERROR: verdaccio did not start in time"
      exit 1
    fi
    sleep 1
  done
else
  echo "[1/4] Verdaccio already running at $VERDACCIO_URL"
  VERDACCIO_PID=""
fi

# 2. Build packages
echo "[2/4] Building packages..."
for pkg in "${PACKAGES[@]}"; do
  echo "  Building $pkg..."
  (cd "$pkg" && pnpm build)
done

# 3. Publish each package to verdaccio
echo "[3/4] Publishing packages..."
for pkg in "${PACKAGES[@]}"; do
  NAME=$(node -p "require('./$pkg/package.json').name")
  echo "  Publishing $NAME..."
  (cd "$pkg" && pnpm publish --no-git-checks --registry "$VERDACCIO_URL")
done

# 4. Verify
echo "[4/4] Verifying..."
for pkg in "${PACKAGES[@]}"; do
  NAME=$(node -p "require('./$pkg/package.json').name")
  VERSION=$(node -p "require('./$pkg/package.json').version")
  echo "  $NAME@$VERSION → $VERDACCIO_URL/$NAME"
done

echo ""
echo "=== Done ==="
echo ""
echo "To install in your frontend project:"
echo "  npm install @ainative-ui/angular --registry $VERDACCIO_URL"
echo ""
echo "To stop verdaccio later:"
if [ -n "${VERDACCIO_PID:-}" ]; then
  echo "  kill $VERDACCIO_PID"
else
  echo "  pkill verdaccio"
fi
