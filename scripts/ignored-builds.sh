#!/usr/bin/env bash

if [ "$VERCEL_ENV" = "production" ] ||
  [ "$VERCEL_GIT_COMMIT_REF" = "develop" ] ||
  [ "$VERCEL_GIT_COMMIT_REF" = "feature/apple-pay" ]; then
  echo "✅ Build allowed — production, develop, or feature/apple-pay branch"
  exit 1
else
  echo "🛑 Build skipped — branch: $VERCEL_GIT_COMMIT_REF"
  exit 0
fi