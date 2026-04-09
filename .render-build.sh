#!/usr/bin/env bash
set -e
pnpm install
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer node node_modules/puppeteer/install.mjs
echo "=== Finding Chrome ==="
find /opt/render/.cache/puppeteer -type f -name "chrome"
