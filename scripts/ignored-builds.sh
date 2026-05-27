#!/usr/bin/env bash

if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_GIT_COMMIT_REF" = "develop" ]; then
  echo "✅ Build allowed — production or develop branch"
  exit 1
else
  echo "🛑 Build skipped — branch: $VERCEL_GIT_COMMIT_REF"
  exit 0
fi