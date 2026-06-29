#!/usr/bin/env bash
#
# Seeds .env.local into the current git worktree by copying it from the
# primary worktree.
#
# Why: Claude Code / Claude Desktop create worktrees via `git worktree add`,
# which checks out tracked files only. .env.local is gitignored, so a fresh
# worktree has no env — and the pre-push `npm run build` (auth0-config.ts
# throws without NEXT_PUBLIC_AUTH0_CLIENT_ID) would fail there. This runs on
# SessionStart (see .claude/settings.json) so every worktree is seeded
# automatically. It is a no-op in the primary worktree, which already has the
# file.
set -euo pipefail

if [ -f .env.local ]; then
  exit 0
fi

# The first entry in `git worktree list` is the primary worktree.
main_worktree="$(git worktree list --porcelain \
  | awk '/^worktree /{ sub(/^worktree /, ""); print; exit }')"

if [ -z "$main_worktree" ]; then
  echo "setup-worktree-env: could not determine the primary worktree." >&2
  exit 0
fi

src="$main_worktree/.env.local"
if [ ! -f "$src" ]; then
  echo "setup-worktree-env: no .env.local in the primary worktree ($main_worktree)." >&2
  echo "  Create one there (copy .env.example) so worktrees can be seeded." >&2
  exit 0
fi

cp "$src" .env.local
echo "setup-worktree-env: copied .env.local from $main_worktree"
