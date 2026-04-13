---
name: security-audit
description: "Perform a structured security vulnerability audit of web applications. Use for audit, review, scan, or check requests about frontend React/JS, backend Flask/Python, APIs, authentication flows, OAuth, JWT, CORS, env vars, file uploads, deployment configs, exploits, bugs, or app security risks."
argument-hint: "[optional app context or files]"
user-invocable: true
disable-model-invocation: false
---

# Security Audit

## When to Use

Use this skill when the user asks to:

- audit, review, scan, or check a web app for security issues
- assess whether an app is secure
- review authentication, OAuth, JWT, CORS, cookies, sessions, or CSRF handling
- inspect backend APIs, file uploads, URL fetching, or deployment configuration
- identify vulnerabilities, exploits, misconfigurations, or data exposure risks

## Audit Workflow

1. Gather context first.

- Identify the stack: frontend framework, backend framework, database, hosting.
- Identify auth method: sessions, JWT, OAuth, API keys, or hybrid flows.
- Identify input surfaces: forms, file uploads, URL fetches, query params, cookies, headers, webhooks.
- Identify deployment details: Vercel, Render, Railway, VPS, environment variables, CORS origins, debug flags.
- If relevant files are shared, read them before drawing conclusions.

2. Audit the app across these domains.

- Authentication and session management
- Authorization and access control
- Input validation and injection risks
- API security
- Secrets and configuration
- Dependency and supply chain risk
- Frontend security risks
- Deployment and infrastructure hardening

3. Assign severity for each finding.

- Critical: exploitable now, takeover or data loss risk
- High: serious and likely exploitable
- Medium: conditional risk or partial exposure
- Low: best-practice gap with limited impact
- Info: observation or improvement note

4. Give concrete fixes.

- Explain the issue clearly
- Include file and line references if known
- Provide copy-pasteable remediation when possible
- Prioritize the highest-risk items first

## What to Check

### Authentication and Session Management

- Verify OAuth state protection and backend token validation.
- Confirm sessions use secure, httpOnly, sameSite cookies.
- Ensure passwords are hashed with bcrypt or argon2.
- Avoid exposing tokens in localStorage when httpOnly cookies are feasible.

### Authorization and Access Control

- Verify protected routes check auth server-side.
- Check for IDOR issues and cross-user data access.
- Ensure role-gated endpoints are enforced on the backend.

### Input Validation and Injection

- Validate all user input server-side.
- Confirm SQL uses ORM or parameterized queries.
- Validate file uploads by MIME type, extension, and size.
- Restrict URL fetchers to safe schemes and block internal IPs.

### API Security

- Require rate limiting on sensitive endpoints.
- Ensure production CORS is explicit, not wildcard.
- Confirm HTTP methods are restricted appropriately.
- Avoid leaking stack traces or internal details in errors.

### Secrets and Configuration

- Verify secrets are loaded from environment variables.
- Check for hardcoded keys, debug mode, and unsafe defaults.
- Confirm production environment variables are set correctly.

### Dependency and Supply Chain

- Flag obviously outdated or risky dependencies.
- Prefer pinned versions in requirements or package manifests.

### Frontend Security

- Avoid secrets in bundled frontend code.
- Flag dangerous HTML injection patterns.
- Recommend a Content-Security-Policy where appropriate.

### Deployment and Infrastructure

- Confirm HTTPS is enforced.
- Recommend security headers such as X-Content-Type-Options, X-Frame-Options, and HSTS.
- Check that debug or admin routes are not exposed publicly.

## Report Format

Return the audit in this structure:

## Security Audit Report — [App Name]

### Summary

Include counts of critical, high, medium, low findings.

### Findings

For each issue, use:

- Severity label
- Location
- Issue
- Fix

### What's Good

List strong security practices you observed.

### Recommended Next Steps

Provide a prioritized action list.

## Default Priority Order

1. Authentication and session flaws
2. Authorization bypasses and IDORs
3. Injection and unsafe input handling
4. Secrets and deployment misconfiguration
5. Frontend exposure and dependency risk

## Notes

- Be specific and actionable.
- Prefer root-cause fixes over surface patches.
- If evidence is missing, state the assumption instead of guessing.
- If the app is small, still audit the full stack that is present.
