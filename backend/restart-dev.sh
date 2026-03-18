#!/bin/bash
pkill -f "nodemon src/index.ts"
npm run dev &
