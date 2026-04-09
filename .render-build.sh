#!/usr/bin/env bash
set -e
pnpm install
PUPPETEER_CACHE_DIR=/opt/render/project/src/.cache/puppeteer node node_modules/puppeteer/install.mjs
