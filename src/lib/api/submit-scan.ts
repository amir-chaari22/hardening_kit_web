/**
 * submit-scan.ts
 * Maps hardening-kit CLI JSON output → Hardening Kit Web API
 *
 * Usage from CI:
 *   RESULT=$(harden scan --env production --project myapp --format json)
 *   npx ts-node -e "
 *     const { submitScan } = require('./src/lib/api/submit-scan')
 *     submitScan(JSON.parse(process.env.RESULT), {
 *       projectId: 'uuid-here',
 *       apiUrl: process.env.HARDENING_KIT_API_URL,
 *       apiKey: process.env.HARDENING_KIT_API_KEY,
 *     })
 *   "
 *
 * Or use the built-in reporter (coming in v1.1) which posts automatically.
 */

interface CliScanResult {
  decision:            'APPROVE' | 'BLOCK' | 'NEEDS_FIXES'
  blocking_violations: Array<{ id: string; message: string; action: string; remediation?: string }>
  warnings:            Array<{ id: string; message: string; action: string; remediation?: string }>
  checks:              { total: number; passed: number; failed: number; skipped: number }
  tools_used:          string[]
  scanner_version:     string
  timestamp:           string
  project:             string
  environment:         string
}

interface SubmitOptions {
  projectId: string
  apiUrl:    string
  apiKey:    string
  commitSha?: string
  branch?:    string
  durationMs?: number
}

export async function submitScan(result: CliScanResult, opts: SubmitOptions): Promise<void> {
  const body = {
    decision:      result.decision,
    environment:   result.environment as 'development' | 'staging' | 'production',
    blockingCount: result.blocking_violations.length,
    warningCount:  result.warnings.length,
    violations:    result.blocking_violations,
    warnings:      result.warnings,
    checksSummary: result.checks,
    toolsUsed:     result.tools_used,
    commitSha:     opts.commitSha ?? process.env.GITHUB_SHA,
    branch:        opts.branch ?? process.env.GITHUB_REF_NAME,
    durationMs:    opts.durationMs,
  }

  const res = await fetch(`${opts.apiUrl}/api/projects/${opts.projectId}/scans`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(`Failed to submit scan: ${err.error ?? res.statusText}`)
  }

  const { scan } = await res.json() as { scan: { id: string; decision: string } }
  // eslint-disable-next-line no-console
  process.stdout.write(`✅ Scan submitted: ${scan.id} (${scan.decision})\n`)
}

/**
 * GitHub Actions example:
 *
 * - name: Submit scan to dashboard
 *   if: always()
 *   run: |
 *     RESULT=$(cat hardening-report.json)
 *     curl -X POST "$HARDENING_KIT_API_URL/api/projects/$PROJECT_ID/scans" \
 *       -H "Authorization: Bearer $HARDENING_KIT_API_KEY" \
 *       -H "Content-Type: application/json" \
 *       -d "{
 *         \"decision\": $(echo $RESULT | jq -r '.eval.decision'),
 *         \"blockingCount\": $(echo $RESULT | jq -r '.eval.blocking_violations | length'),
 *         \"warningCount\": $(echo $RESULT | jq -r '.eval.warnings | length'),
 *         \"violations\": $(echo $RESULT | jq -r '.eval.blocking_violations'),
 *         \"warnings\": $(echo $RESULT | jq -r '.eval.warnings'),
 *         \"checksSummary\": $(echo $RESULT | jq -r '.checks_summary'),
 *         \"commitSha\": \"$GITHUB_SHA\",
 *         \"branch\": \"$GITHUB_REF_NAME\",
 *         \"environment\": \"production\"
 *       }"
 */
