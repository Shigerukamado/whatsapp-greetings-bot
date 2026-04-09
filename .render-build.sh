#!/usr/bin/env bash
pnpm install
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer node node_modules/puppeteer/install.mjs
