#!/usr/bin/env bash
# Scan staged changes for secrets. Uses gitleaks when installed, plus a pattern grep either way,
# so a missing gitleaks never blocks the workflow.
# Exit: 0 clean, 1 possible secret found (details on stdout, values redacted).
set -uo pipefail

found=0
if command -v gitleaks >/dev/null; then
  gitleaks git --pre-commit --staged --redact --no-banner || found=1
else
  echo "gitleaks not installed; pattern scan only"
fi

# Sensitive file names. Allowlisted basenames (committed templates) skip only this name check;
# their contents still go through gitleaks and the pattern scan below.
allow='(^|/)\.env\.example$'
if git diff --cached --name-only | grep -vEi "$allow" | grep -nEi '(^|/)(\.env(\..*)?|.*\.pem|.*\.p12|.*\.key|id_(rsa|ed25519|ecdsa)|credentials(\.json)?)$'; then
  echo "^ sensitive file staged"
  found=1
fi

# Added lines that look like secrets; print file and line, never the value.
pattern='(AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|sk-(ant-)?[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|password|passwd|token)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"' ]{8,})'
# Number each added line as file:line, then match the pattern and keep only the location.
hits=$(git diff --cached -U0 --no-color | awk '
  /^\+\+\+ b\// { file = substr($0, 7); next }
  /^@@/ { split($3, a, ","); line = substr(a[1], 2) - 1; next }
  /^\+/ { line++; print file ":" line "\t" substr($0, 2) }
' | grep -iE "$pattern" | cut -f1 | sed 's/$/: [redacted]/')
if [ -n "$hits" ]; then
  echo "$hits"
  found=1
fi

[ $found -eq 0 ] && echo "secret scan: clean"
exit $found
