#!/bin/bash
export PATH="$HOME/.local/node-v22.11.0-darwin-arm64/bin:$PATH"
cd "$(dirname "$0")"
npx tsx src/server.ts
