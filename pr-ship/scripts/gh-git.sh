#!/usr/bin/env bash
# Remote git operations over HTTPS, authenticated by gh (`gh auth git-credential`).
# SSH remotes (e.g. a host alias on port 22) can hang or fail while gh keeps working,
# so the ship skills never talk to the remote through `origin`'s own URL.
#
# Usage: gh-git.sh push [--force-with-lease]   push HEAD to the same-named branch, set upstream
#        gh-git.sh fetch [branch...]           update refs/remotes/origin/* (default: all, pruned)
#        gh-git.sh pull <branch>               fetch <branch>, then fast-forward the current branch to it
#        gh-git.sh delete-remote <branch>      delete a branch on GitHub (via the API)
#        gh-git.sh repo                        print owner/name
set -euo pipefail

command -v gh >/dev/null || { echo "gh-git: gh not installed" >&2; exit 2; }
repo=${GH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}
url="https://github.com/$repo.git"
export GIT_TERMINAL_PROMPT=0
g() { git -c credential.helper= -c 'credential.helper=!gh auth git-credential' "$@"; }

cmd=${1:?usage: gh-git.sh push|fetch|pull|delete-remote|repo}
shift
case "$cmd" in
  repo) echo "$repo" ;;
  push)
    branch=$(git symbolic-ref --short HEAD)
    lease=()
    if [ "${1:-}" = "--force-with-lease" ]; then
      expected=$(git rev-parse -q --verify "refs/remotes/origin/$branch" || true)
      lease=("--force-with-lease=refs/heads/$branch:$expected")
    fi
    g push --quiet "${lease[@]}" "$url" "HEAD:refs/heads/$branch"
    # Record what was pushed and track it, as `git push -u origin` would.
    git update-ref "refs/remotes/origin/$branch" HEAD
    git config "branch.$branch.remote" origin
    git config "branch.$branch.merge" "refs/heads/$branch"
    echo "pushed $branch @ $(git rev-parse --short HEAD) to $repo"
    ;;
  fetch)
    if [ $# -eq 0 ]; then
      g fetch --quiet --prune "$url" '+refs/heads/*:refs/remotes/origin/*'
    else
      for b in "$@"; do g fetch --quiet "$url" "+refs/heads/$b:refs/remotes/origin/$b"; done
    fi
    ;;
  pull)
    b=${1:?usage: gh-git.sh pull <branch>}
    g fetch --quiet "$url" "+refs/heads/$b:refs/remotes/origin/$b"
    git merge --ff-only --quiet "origin/$b"
    echo "$(git symbolic-ref --short HEAD) at $(git rev-parse --short HEAD)"
    ;;
  delete-remote)
    b=${1:?usage: gh-git.sh delete-remote <branch>}
    # 422 = already gone (e.g. the repo deletes head branches on merge).
    if gh api -X DELETE "repos/$repo/git/refs/heads/$b" --silent 2>/dev/null; then
      echo "deleted $b on GitHub"
    else
      echo "$b not on GitHub (already deleted)"
    fi
    git update-ref -d "refs/remotes/origin/$b" 2>/dev/null || true
    ;;
  *) echo "gh-git: unknown command $cmd" >&2; exit 2 ;;
esac
