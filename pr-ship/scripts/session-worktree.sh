#!/usr/bin/env bash
# Ship only this session's changes. Several Claude sessions can share one checkout, so the ship
# skills never stage, switch, stash, or rebase in it: they build a separate worktree holding just
# the files this session changed, and commit and push from there.
#
# Usage (run from anywhere inside the main checkout):
#   session-worktree.sh create <base> <branch> <wt-dir> <file>...
#       Fetch origin/<base>, create <branch> from it in <wt-dir>, and apply the files' changes
#       (main checkout vs its HEAD, including new and deleted files) there, staged.
#   session-worktree.sh sync <branch> <file>...
#       Copy the files' current content from the main checkout into <branch>'s existing worktree
#       and stage them (more changes for a PR this session already opened).
#   session-worktree.sh release <base> <branch> <reviewed-sha> <merge-sha> <file>...
#       After the merge: remove <branch>'s worktree and local branch, then, if the main checkout is
#       on <base> and every file there matches the merged content, drop those now-redundant local
#       edits and fast-forward <base>. Anything else in the main checkout is left untouched.
# <file>s are paths relative to the repo root.
# Exit: 0 ok, 1 nothing to ship / changes don't apply / release left something for a human, 2 usage or tool error.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
gh_git() { bash "$here/gh-git.sh" "$@"; }
top=$(git rev-parse --show-toplevel)
cd "$top"
# Worktree path of a branch, empty if it has none.
wt_of() { git worktree list --porcelain | awk -v b="refs/heads/$1" '/^worktree /{p=substr($0,10)} $0=="branch " b {print p}'; }

cmd=${1:?usage: session-worktree.sh create|sync|release ...}
shift
case "$cmd" in
  create)
    base=${1:?base}; branch=${2:?branch}; wt=${3:?wt-dir}; shift 3
    [ $# -gt 0 ] || { echo "no files given" >&2; exit 2; }
    [ ! -e "$wt" ] || { echo "$wt already exists" >&2; exit 2; }
    ! git show-ref --verify -q "refs/heads/$branch" || { echo "branch $branch already exists" >&2; exit 2; }

    patch=$(mktemp)
    trap 'rm -f "$patch"' EXIT
    for f in "$@"; do
      if git cat-file -e "HEAD:$f" 2>/dev/null; then
        git diff HEAD --binary -- "$f" >>"$patch"        # modified or deleted
      elif [ -e "$f" ]; then
        git diff --no-index --binary /dev/null "$f" >>"$patch" || [ $? -eq 1 ]   # new file
      else
        echo "skip $f: not in HEAD and not on disk" >&2
      fi
    done
    [ -s "$patch" ] || { echo "nothing to ship: the given files have no changes against HEAD"; exit 1; }

    gh_git fetch "$base"
    git worktree add --quiet -b "$branch" "$wt" "origin/$base"
    if ! git -C "$wt" apply --index --3way --whitespace=nowarn "$patch"; then
      git worktree remove --force "$wt"
      git branch -D --quiet "$branch"
      echo "the session's changes don't apply cleanly to origin/$base; worktree removed" >&2
      exit 1
    fi
    echo "worktree $wt on $branch (from origin/$base @ $(git rev-parse --short "origin/$base"))"
    git -C "$wt" status --short
    ;;

  sync)
    branch=${1:?branch}; shift
    [ $# -gt 0 ] || { echo "no files given" >&2; exit 2; }
    wt=$(wt_of "$branch")
    [ -n "$wt" ] || { echo "no worktree for $branch" >&2; exit 2; }
    for f in "$@"; do
      if [ -e "$f" ]; then
        mkdir -p "$wt/$(dirname "$f")"
        cp -p "$f" "$wt/$f"
        git -C "$wt" add -- "$f"
      else
        git -C "$wt" rm --quiet --ignore-unmatch -- "$f"
      fi
    done
    git -C "$wt" status --short
    ;;

  release)
    base=${1:?base}; branch=${2:?branch}; reviewed=${3:?reviewed-sha}; merged=${4:?merge-sha}; shift 4
    status=0
    wt=$(wt_of "$branch")
    if [ -n "$wt" ] && [ "$wt" != "$top" ]; then
      if git worktree remove "$wt"; then echo "removed worktree $wt"
      else echo "kept worktree $wt: it has uncommitted changes"; status=1; fi
    fi
    if git show-ref --verify -q "refs/heads/$branch"; then
      if [ -n "$(wt_of "$branch")" ]; then
        echo "kept branch $branch: still checked out"; status=1
      elif git branch -d --quiet "$branch" 2>/dev/null; then echo "deleted branch $branch"
      elif [ "$(git rev-parse "$branch")" = "$(git rev-parse "$reviewed")" ]; then
        git branch -D --quiet "$branch"; echo "deleted branch $branch (was the reviewed SHA)"
      else echo "kept branch $branch: it has commits that weren't reviewed"; status=1; fi
    fi

    gh_git fetch "$base"
    current=$(git symbolic-ref --short -q HEAD || true)
    if [ "$current" != "$base" ]; then
      echo "main checkout is on ${current:-a detached HEAD}, not $base: left as is (the session's edits there are now also in $base)"
      exit $status
    fi
    git cat-file -e "$merged^{commit}" 2>/dev/null || gh_git fetch "$base"
    differ=()
    for f in "$@"; do
      if git cat-file -e "$merged:$f" 2>/dev/null; then
        [ -f "$f" ] && git show "$merged:$f" | cmp -s - "$f" || differ+=("$f")
      else
        [ ! -e "$f" ] || differ+=("$f")
      fi
    done
    if [ ${#differ[@]} -gt 0 ]; then
      echo "main checkout not updated: these files differ from what was merged (edited since, or by another session):"
      printf '  %s\n' "${differ[@]}"
      exit 1
    fi
    # Identical to the merge, so dropping the local copies loses nothing; the pull brings them back.
    for f in "$@"; do
      if git cat-file -e "HEAD:$f" 2>/dev/null; then
        git restore --source=HEAD --staged --worktree -- "$f"
      else
        git rm --cached --quiet --ignore-unmatch -- "$f"
        rm -f -- "$f"
      fi
    done
    gh_git pull "$base"
    exit $status
    ;;

  *) echo "session-worktree: unknown command $cmd" >&2; exit 2 ;;
esac
