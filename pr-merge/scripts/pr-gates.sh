#!/usr/bin/env bash
# Collect merge-gate status for a GitHub PR as JSON.
# Usage: pr-gates.sh <pr-number|url> [reviewed-sha]
# Exit: 0 all blocking gates pass, 1 a blocking gate fails, 2 usage/tool error.
set -euo pipefail
trap 'echo "{\"error\":\"command failed at line $LINENO\"}"; exit 2' ERR

pr="${1:?usage: pr-gates.sh <pr> [reviewed-sha]}"
reviewed_sha="${2:-}"
command -v gh >/dev/null || { echo '{"error":"gh not installed"}'; exit 2; }
command -v jq >/dev/null || { echo '{"error":"jq not installed"}'; exit 2; }

repo=${GH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}
owner=${repo%%/*}; name=${repo##*/}

pr_json=$(gh pr view "$pr" --json number,state,isDraft,headRefOid,baseRefName,mergeable,mergeStateStatus,reviewDecision,labels,statusCheckRollup,commits)
number=$(jq -r .number <<<"$pr_json")
base=$(jq -r .baseRefName <<<"$pr_json")

threads=$(gh api graphql -F owner="$owner" -F name="$name" -F n="$number" -f query='
query($owner:String!,$name:String!,$n:Int!){repository(owner:$owner,name:$name){pullRequest(number:$n){
  reviewThreads(first:100){nodes{isResolved isOutdated path}}}}}' \
  -q '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved|not)] | length')

sigs=$(gh api "repos/$repo/pulls/$number/commits?per_page=100" \
  -q '[.[] | select(.commit.verification.verified|not) | .sha[0:7]]')

# Branch protection or rulesets on the base (either counts). 403/404 => none or not visible.
# gh prints the error body to stdout on failure, so discard output unless the call succeeds.
api_or() { local fallback=$1 out; shift; out=$(gh api "$@" 2>/dev/null) && echo "$out" || echo "$fallback"; }
protected=false
gh api "repos/$repo/branches/$base/protection" >/dev/null 2>&1 && protected=true
[ "$protected" = false ] && [ "$(api_or 0 "repos/$repo/rules/branches/$base" -q length)" != 0 ] && protected=true
requires_sigs=$(api_or false "repos/$repo/branches/$base/protection/required_signatures" -q .enabled)

result=$(jq -n \
  --argjson pr "$pr_json" \
  --arg reviewed "$reviewed_sha" \
  --argjson threads "$threads" \
  --argjson unsigned "$sigs" \
  --argjson protected "$protected" \
  --argjson requires_sigs "$requires_sigs" '
  def ok(c): if c then "pass" else "fail" end;
  ($pr.statusCheckRollup // []) as $checks
  | [ $checks[] | (.conclusion // .state // .status) | ascii_upcase ] as $s
  | ([ $s[] | select(IN("SUCCESS","NEUTRAL","SKIPPED")|not) ]) as $bad
  | ([ $pr.labels[].name | ascii_downcase | select(test("do-not-merge|^wip$|^hold$|blocked")) ]) as $blk
  | {
      state:          ok($pr.state=="OPEN" and ($pr.isDraft|not)),
      head_unchanged: (if $reviewed=="" then "skip" else ok($pr.headRefOid | startswith($reviewed)) end),
      ci:             (if ($bad|length)==0 then "pass"
                       elif ([ $bad[] | select(IN("PENDING","QUEUED","IN_PROGRESS","EXPECTED","WAITING","REQUESTED")) ]|length)==($bad|length) then "pending"
                       else "fail" end),
      review_decision: ok(($pr.reviewDecision // "") | IN("APPROVED","")),
      threads:        ok($threads==0),
      mergeable:      ok($pr.mergeable=="MERGEABLE" and ($pr.mergeStateStatus|IN("CLEAN","HAS_HOOKS","UNSTABLE"))),
      up_to_date:     ok($pr.mergeStateStatus!="BEHIND"),
      labels:         ok(($blk|length)==0),
      signatures:     (if ($unsigned|length)==0 then "pass" elif $requires_sigs then "fail" else "warn" end),
      protection:     (if $protected then "pass" else "warn" end)
    } as $g
  | { pr: $pr.number, head: $pr.headRefOid, base: $pr.baseRefName,
      reviewDecision: $pr.reviewDecision, mergeStateStatus: $pr.mergeStateStatus,
      unresolved_threads: $threads, failing_checks: [ $checks[] | select(((.conclusion // .state // .status)|ascii_upcase)|IN("SUCCESS","NEUTRAL","SKIPPED")|not) | (.name // .context) ],
      unsigned_commits: $unsigned, blocking_labels: $blk,
      gates: $g,
      ready: ([ $g | to_entries[] | select(.value=="fail" or .value=="pending") ] | length == 0) }')

echo "$result"
[ "$(jq -r .ready <<<"$result")" = true ] && exit 0 || exit 1
