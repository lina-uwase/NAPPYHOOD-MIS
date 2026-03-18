#!/bin/bash
pkill -f "nodemon src/index.ts" || true
pkill -f "ts-node src/index.ts" || true
npm run dev &
