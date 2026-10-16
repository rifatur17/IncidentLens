# Security remediation â€” 2026-10-16

**Current follow-up:** the blocked assessment below is historical. A scoped
workspace adapter now retains fast-glob/Picomatch behavior while replacing its
vulnerable brace-expansion path with patched brace-expansion 5.0.12. The full local
dependency audit reports zero findings; compatibility and security regressions
are enforced in CI. See [the adapter documentation](../../tools/eslint-glob-compat/README.md).

## Scope and baseline

Reviewed clean `main` at migration commit `c63ec667e8ad6b00a7c788fc5999b41af0cb5085`, both manifests, the lockfile, workspace policies, the original Security logs, and GitHub CI. Original migration CI completed successfully (backend, frontend, browser jobs); Security failed at Gitleaks before the audits ran. Fresh local audit reproduced 29 findings: 2 critical, 12 high, 11 moderate, 4 low.

## Compatible dependency changes

- Next.js and eslint-config-next: 16.3.3 â†’ 16.3.8, a patch release containing security fixes. React, TypeScript, Vitest, Playwright and backend dependency declarations remain unchanged.
- concurrently: 9.2.4 â†’ 9.2.5, using its maintenance backport rather than the 10.x major; this updates pinned shell-quote to 1.12.0.
- Refresh affected transitive dependencies within compatible parent ranges. js-yaml â†’ 4.3.2, undici â†’ 7.29.1, sharp â†’ 0.35.5, source-map-js â†’ 1.2.2, brace-expansion 1.x â†’ 1.1.21.
- A narrowly scoped workspace override selects brace-expansion 5.0.12 for vulnerable 5.x versions, within minimatch's ^5.0.8 range. The 1.x dependency remains 1.x; no cross-major substitution. Remove this override once ordinary resolution reliably selects the patch.
- Remove obsolete release-age exceptions for vulnerable Next.js 16.3.3. No audit exclusions, severity changes, forced major upgrades, or runtime application changes.

## Every baseline audit finding

Next.js is direct; all other affected packages below are transitive. shell-quote is under the root development tool concurrently. sharp is an optional production dependency; source-map-js occurs in both production and development paths; other non-Next findings are development tooling. The complete dependency paths are in the captured JSON audit.

| Package / installed version | Severity | Advisory / details | Audit patched range |
|---|---|---|---|
| sharp 0.35.3 | high | [sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | `>=0.35.4` |
| js-yaml 4.3.1 | high | [js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | `>=4.3.2` |
| undici 7.29.0 | moderate | [undici vulnerable to Denial of Service via unhandled error in WebSocket permessage-deflate decompression](https://github.com/advisories/GHSA-3wwx-pv8p-q78v) | `>=7.29.1` |
| undici 7.29.0 | moderate | [undici vulnerable to Denial of Service via orphaned RetryHandler response body](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) | `>=7.29.1` |
| undici 7.29.0 | low | [undici vulnerable to downstream response splitting via retry interceptor](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) | `>=7.29.1` |
| undici 7.29.0 | high | [undici vulnerable to Denial of Service via unrequested WebSocket subprotocol](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) | `>=7.29.1` |
| undici 7.29.0 | moderate | [undici vulnerable to Denial of Service via unbounded decompression of compressed responses](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) | `>=7.29.1` |
| undici 7.29.0 | moderate | [undici vulnerable to cross-user cookie disclosure via Set-Cookie caching in shared caches](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) | `>=7.29.1` |
| undici 7.29.0 | low | [undici vulnerable to response truncation via oversized chunked responses in the dump interceptor](https://github.com/advisories/GHSA-2gqq-gqf2-x968) | `>=7.29.1` |
| undici 7.29.0 | high | [undici vulnerable to TLS certificate validation bypass via dropped connect options in BalancedPool](https://github.com/advisories/GHSA-w293-vg96-wgc3) | `>=7.29.1` |
| undici 7.29.0 | low | [undici vulnerable to caching and replay of unsafe HTTP method responses](https://github.com/advisories/GHSA-8436-99hf-9mmv) | `>=7.29.1` |
| undici 7.29.0 | moderate | [undici vulnerable to Denial of Service via WebSocketStream unclean close](https://github.com/advisories/GHSA-rx4f-c7p8-82vq) | `>=7.29.1` |
| brace-expansion 1.1.18 | moderate | [brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `>=1.1.21` |
| brace-expansion 5.0.9 | moderate | [brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `>=5.0.12` |
| brace-expansion 1.1.18 | high | [brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `>=1.1.20` |
| brace-expansion 5.0.9 | high | [brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `>=5.0.11` |
| brace-expansion 1.1.18 | high | [brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `>=1.1.19` |
| brace-expansion 5.0.9 | high | [brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `>=5.0.10` |
| next 16.3.3 | critical | [Next.js: Remote Code Execution in next/og ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | `>=16.3.6` |
| braces 3.0.3 | high | [braces vulnerable to stack-exhaustion denial of service through deeply nested patterns](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | `>=3.0.4` |
| source-map-js 1.2.1 | high | [source-map-js allows event-loop denial of service through indexed source-map section offsets](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | `>=1.2.2` |
| sharp 0.35.3 | high | [sharp : Vulnerability in librsvg dependency CVE-2026-96889](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | `>=0.35.5` |
| shell-quote 1.9.0 | critical | [shell-quote: `quote()` command injection via a line terminator in a token after a `{ comment }` token](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) | `>=1.11.0` |
| next 16.3.3 | moderate | [Next.js: Pending `use cache` fill can leak Draft Mode content into regular responses and persisted pages](https://github.com/advisories/GHSA-3w37-wq28-93x7) | `>=16.3.8` |
| next 16.3.3 | moderate | [Next.js has cache poisoning of SSG and ISR pages in self-hosted applications](https://github.com/advisories/GHSA-4jqv-mc3x-m676) | `>=16.3.8` |
| next 16.3.3 | low | [Next.js has information disclosure in development server's Model Context Protocol endpoint](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | `>=16.3.8` |
| next 16.3.3 | moderate | [Next.js has information disclosure in App Router metadata image routes via dynamicParams bypass](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | `>=16.3.8` |
| next 16.3.3 | moderate | [Next.js has cache poisoning in SSG/ISR rendering that leads to cross-user content substitution and persistent denial of service](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | `>=16.3.8` |
| next 16.3.3 | high | [Next.js has Server-Side Request Forgery in Image Optimization](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | `>=16.3.8` |

## Remaining finding and mitigation

Full `pnpm audit --json` / `pnpm audit --audit-level high`: **1 high**, zero critical/moderate/low. `pnpm audit --prod --json`: **zero vulnerabilities**. This is not an all-dependencies clean audit.

The remaining [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) is braces 3.0.3 via eslint-config-next â†’ @next/eslint-plugin-next â†’ fast-glob â†’ micromatch. npm audit advertises >=3.0.4, but that release returns 404 from the official registry and the package latest is 3.0.3. GitHub explicitly lists no patched version. Do not override to an unpublished version, substitute an unrelated package, or invent an unreviewed recursive-parser fork to obtain a green audit.

Restrict lint/build glob patterns and configuration to reviewed repository content. Do not feed request data or untrusted external configuration/patterns to this tooling; do not expose lint tasks as an API. The current path is a development dependency, absent from the production-only audit. This limits exposure but does not fix the vulnerable package. Keep the full high-severity CI audit failing visibly until an upstream patch or a separately evaluated tooling replacement is available.

## Braces parent-package follow-up (2026-10-16)

Fresh `pnpm --filter incidentlens-frontend why braces` identifies one installed version and one chain:

```text
incidentlens-frontend (devDependency)
  eslint-config-next@16.3.8
    @next/eslint-plugin-next@16.3.8
      fast-glob@3.3.1
        micromatch@4.0.8
          braces@3.0.3
```

Checked official npm registry metadata before attempting any dependency mutation:

| Candidate | Published version checked | Does it remove the vulnerable dependency? |
|---|---|---|
| braces | latest 3.0.3 | No published patched release; do not use the audit's unavailable 3.0.4 suggestion. |
| micromatch | latest 4.0.8 | No: depends on braces `^3.0.3`. |
| fast-glob | latest 3.3.3 | No: depends on micromatch `^4.0.8`. |
| @next/eslint-plugin-next | latest stable 16.4.2 | No: still pins fast-glob 3.3.1. |
| eslint-config-next | latest stable 16.4.2 | No: depends on @next/eslint-plugin-next 16.4.2, retaining the same chain. |

Sources: [braces](https://registry.npmjs.org/braces/latest), [micromatch](https://registry.npmjs.org/micromatch/latest), [fast-glob](https://registry.npmjs.org/fast-glob/latest), [Next ESLint plugin](https://registry.npmjs.org/@next/eslint-plugin-next/latest), [Next ESLint config](https://registry.npmjs.org/eslint-config-next/latest). These `latest` endpoints may change; versions above record this assessment, not a promise about later releases.

No compatible published update in this chain addresses the advisory, so no dependency/lockfile changes are justified by this review. Replacing braces with brace-expansion would substitute a different API, not a compatible fix. Removing Next's ESLint rules or inventing a parser patch would need separate compatibility and security analysis and must not be used merely to make the audit green.

The risk is process termination when a sufficiently nested untrusted glob reaches the parser's recursive walkers. This project's frontend ESLint configuration imports Next's standard rules and supplies fixed ignore patterns; it does not accept HTTP request patterns. Keep all lint configuration and glob inputs reviewed, run tooling with ordinary least-privilege development/CI permissions, and never expose it as a request-driven service. This reduces exposure; it does not resolve the advisory. Keep the full dependency audit and security scanning enabled. Recheck the registry/advisory before applying a future published patch.

Follow-up local checks: backend 23 tests and frontend 8 unit tests passed; lint, mypy, TypeScript, production build, benchmark reproduction, Python dependency audit and both scanner regressions passed. Fresh full audit still reports **1 high**; production-only audit reports **0**. GitHub at starting commit b316cc0 confirmed CI success and Security failure at the full dependency audit. All 4 desktop/mobile browser tests passed again. Subsequent workflow results are recorded in the delivery report.

## Full-history secret scanning

The action v3 builds `--no-merges --first-parent baseRef^..headRef`. The initial migrated push selected original root `29d35b5cbf3e3efc06971af6e2b57f26586f0622` as base; its nonexistent parent caused an ambiguous revision error. `fetch-depth: 0` cannot manufacture a root parent.

Use official Gitleaks 8.30.1 CLI, pin the Linux archive SHA-256 from its release checksums, verify before extracting/executing, and fail closed on download/checksum/scan errors. With complete checkout history, `gitleaks git --log-opts="--all" --redact --exit-code=1 --no-banner .` scans all reachable commits without a range or merge exclusions, for pushes, PRs and scheduled runs. No findings are ignored and no secrets are printed. This covers Git history reachable from fetched refs, not deleted/unavailable remote history.

`tests/security/test_gitleaks.py` exercises the real scanner against disposable repositories: clean root with no parent succeeds; synthetic invalid credential committed at root then deleted is still detected with a nonzero exit and redacted output. It requires GITLEAKS_BINARY or a scanner on PATH; the Security job supplies the verified binary. Fixture commits use the actual project author identity and never touch project history.

## Validation notes

- Backend: 23 tests passed; Ruff, mypy (35 files), dependency consistency, benchmark evaluation and reproducibility passed. Python dependency audit found no known vulnerabilities.
- Frontend: lint, type checking and Next.js production build passed. All 8 unit tests passed with their default API URL. An initial local harness override used 127.0.0.1 where an existing unit test expects localhost; correcting only the external runner environment resolved it.
- Browser test diagnosis: the old 350 ms API delay could expire before Playwright observed the transient loading state. Replace the delay with a request gate released only after that same visibility assertion; retain all later journey assertions. The corrected desktop/mobile browser run passed all 4 tests. Record GitHub results separately after execution.
- Initial new scanner test expected a rule name on normal CLI stdout; corrected it to inspect the scanner JSON report, retaining detection and output redaction assertions. Both tests then passed.
- Live paid-provider calls, production deployments, and manual visual testing are outside this verification. No credentials, dependencies, generated builds, or browser binaries are committed.
