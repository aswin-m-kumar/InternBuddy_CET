---
name: zero-cost-stack
description: >
  Architect, deploy, and maintain professional web applications using exclusively free-tier cloud infrastructure. Use this skill whenever the user asks about free hosting, zero-cost deployment, free databases, free CI/CD, free auth, free storage, free email, free analytics, cold start fixes, or asks "how do I deploy this for free". Also trigger for questions like "what's the best free alternative to X", "how do I avoid paying for Y", "free tier comparison", or when the user is bootstrapping a project with no infrastructure budget. Covers the full stack: compute, database, storage, auth, CI/CD, observability, email, DNS, and frontend.
---

# Zero-Cost Stack - 2026 Blueprint

Build and ship professional web apps with $0 infrastructure spend. This skill covers every layer of the stack with the optimal free-tier choice per category.

---

## Core Philosophy

- Poly-cloud is mandatory - no single provider covers everything optimally
- Clean Architecture - decouple business logic from infra so any provider can be swapped without rewrites
- Dependency Rule - code dependencies point inward; external services are injected, not hardcoded
- DRY + minimal payload - minimize bandwidth consumption on metered free tiers

---

## Layer-by-Layer Stack Decisions

### Compute

| Need                        | Best Free Choice                     | Key Limit                              |
| --------------------------- | ------------------------------------ | -------------------------------------- |
| Heavy backend / always-on   | **Oracle Cloud (OCI)** ARM           | 4 cores, 24GB RAM, permanent           |
| Lightweight PaaS            | **Render**                           | Sleeps after 15min idle                |
| Serverless / edge functions | **Vercel** or **Cloudflare Workers** | Per-request billing starts after limit |
| Fallback PaaS               | **Fly.io**                           | Similar sleep behavior to Render       |

**OCI is the anomaly** - 24GB RAM, 4 ARM cores, permanent, no sleep. Use it for any backend that can't tolerate cold starts.

#### Cold Start Mitigation (for Render/Heroku/Fly)

- Deploy a keep-alive pinger (Node.js cron) that hits the service URL every 10 minutes
- Render free tier = 750 hrs/month - a 24/7 service uses ~744hrs, leaving minimal margin
- For production: migrate to OCI ARM instead

---

### Frontend Hosting

**Default: Vercel**

- Global edge network, automatic deploys from Git, serverless functions, built-in analytics
- Best paired with Next.js (SSR + SSG for SEO)
- Alternative: Netlify (comparable free tier)

**Framework picks:**

- Next.js - SSR/SSG, best for SEO and performance
- Vue 3 - Composition API, middle ground
- Angular - strict conventions, enterprise patterns

---

### Database

| Type       | Best Free Choice                      | Storage               | Notes                              |
| ---------- | ------------------------------------- | --------------------- | ---------------------------------- |
| Relational | **Oracle Autonomous DB**              | 20GB                  | Permanent, 2 instances             |
| NoSQL      | **Oracle NoSQL** or **MongoDB Atlas** | 25GB / 512MB          | Atlas has generous free M0 cluster |
| DynamoDB   | **AWS DynamoDB**                      | 25GB                  | Pairs well with Lambda             |
| Analytical | **BigQuery**                          | 10GB + 1TB queries/mo | Google Cloud                       |

**Avoid Render PostgreSQL for production** - expires after 30 days, no backups, random restarts.

---

### Object Storage

**Default: Cloudflare R2**

|             | AWS S3     | Cloudflare R2 |
| ----------- | ---------- | ------------- |
| Storage     | 5GB free   | 10GB free     |
| Egress fees | ~$0.09/GB  | **$0.00**     |
| API         | Native AWS | S3-compatible |

R2 eliminates egress fees entirely. Use standard AWS SDK, just swap the endpoint URL to Cloudflare's. For media-heavy apps, R2 saves ~99% vs S3 on bandwidth costs.

**S3 only if:** HIPAA compliance required, or app is fully AWS-native with CloudFront.

---

### Authentication

| Choice                    | MAU Limit | Best For                                |
| ------------------------- | --------- | --------------------------------------- |
| **NextAuth.js (Auth.js)** | Unlimited | Full control, self-hosted session store |
| **Supabase Auth**         | 50,000    | Full-stack apps, built-in RLS           |
| **Firebase Auth**         | 50,000    | Google ecosystem, mobile                |
| **Clerk**                 | 10,000    | Rapid prototyping, polished UI          |
| **Auth0**                 | 7,500     | Enterprise RBAC, SOC2                   |

**Default recommendation: NextAuth.js** - no MAU cap, handles OAuth/OIDC/JWT/cookies, runs within your own infra. Requires a DB for persistent sessions.

For Google OAuth specifically:

- Use `@react-oauth/google` on frontend (popup flow)
- Verify `id_token` server-side with `google-auth` library
- Return your own JWT; never trust the frontend token directly

---

### DNS & Domain

**DNS: Always use Cloudflare** (free)

- Reverse proxy, hides origin IP
- Free WAF, DDoS protection, SSL/TLS offloading
- CDN caching, edge rules

**Free domains (2026):**

- `is-a.dev` - open-source, PR-based, Cloudflare-backed
- `DigitalPlat FreeDomain` - `.us.kg`, `.dpdns.org`, nonprofit-run
- Truly free TLDs (.tk, .ml) - effectively dead due to abuse shutdowns

---

### Email (Transactional)

| Provider     | Free Limit          | Best For                        |
| ------------ | ------------------- | ------------------------------- |
| **Resend**   | 3,000/mo (100/day)  | Modern API, React Email support |
| **Brevo**    | 300/day (~9,000/mo) | Highest daily volume            |
| **Mailtrap** | 4,000/mo            | Dev/testing environments        |
| **Mailgun**  | 100/day             | Reliable, standard choice       |

**No free SMS exists** - all providers (Twilio, Vonage, Telnyx) charge per message due to carrier fees. Workarounds:

- Use email OTP instead
- TOTP authenticator apps (no cost at all)
- Self-host WAHA for WhatsApp automation (high maintenance)

---

### CI/CD

**Default: GitHub Actions**

- Unlimited minutes for public repos
- 2,000 min/month for private repos
- Massive reusable workflow marketplace

GitLab CI = 400 min/month free. GitHub wins by 5x.

When minutes run out: deploy self-hosted runner on OCI ARM instance (free compute).

---

### UI Component Library

| Library              | Best For                                                      |
| -------------------- | ------------------------------------------------------------- |
| **Shadcn UI**        | TailwindCSS users, full design control, code-owned components |
| **Material UI**      | Enterprise data-heavy apps                                    |
| **Chakra / Mantine** | Rapid dev, accessibility-first                                |
| **Ant Design**       | Internal dashboards                                           |
| **TailwindCSS**      | Bespoke interfaces with strong design resources               |

Shadcn UI is the paradigm shift pick - components are copied into your codebase, not installed as a package. You own the code entirely.

---

### Observability

| Need              | Tool                             | Free Limit                          |
| ----------------- | -------------------------------- | ----------------------------------- |
| Error tracking    | **Sentry**                       | Standard free tier                  |
| Log storage       | **Axiom**                        | 25GB storage, 500GB ingest/mo       |
| Uptime monitoring | **BetterStack** or **Exit1.dev** | 10 monitors, 1-min intervals        |
| Analytics         | **Umami**                        | 100k events/mo, cookieless, GDPR    |
| Status page       | **StatusGator**                  | 3 monitors, 5000+ upstream services |

Avoid Datadog/New Relic/Splunk free tiers - too restrictive for sustained use.

---

### Search

| Option                               | Free Limit                   | Notes                                |
| ------------------------------------ | ---------------------------- | ------------------------------------ |
| **Algolia**                          | 10k requests + 1M records/mo | Best managed experience              |
| **Typesense** (self-hosted on OCI)   | Unlimited                    | C++, fast, low memory, typo-tolerant |
| **Meilisearch** (self-hosted on OCI) | Unlimited                    | Rust, instant search, polished       |

If you have OCI ARM: self-host Typesense or Meilisearch - unlimited records, no monthly caps.

---

### CMS (if needed)

| CMS           | Free Highlights                                                |
| ------------- | -------------------------------------------------------------- |
| **Sanity**    | 10k docs, 100GB bandwidth, 1M API CDN calls/mo - most generous |
| **Prismic**   | 4M API calls/mo, unlimited assets                              |
| **Storyblok** | 1TB asset storage, visual editor                               |

---

### Project Management

- **Linear** - keyboard-first, GitHub integration, sprint planning, 10 members free
- **Notion** - engineering wiki, ADRs, API docs, free for individuals/small teams
- **Trello** - simple Kanban, zero learning curve

---

## Reference Architecture (Full Stack)

```
User -> Cloudflare (DNS + WAF + CDN)
     -> Vercel Edge (Next.js frontend)
     -> OCI ARM (Flask/Node backend, always-on)
     -> Oracle Autonomous DB (structured data)
     -> Cloudflare R2 (media/uploads, zero egress)
     -> NextAuth.js (auth middleware)
     -> Resend (transactional email)
     -> Axiom + Sentry (logs + errors)
     -> GitHub Actions (CI/CD)
     -> Umami (analytics)
```

---

## Decision Flowchart

**Backend needs to be always-on?**
-> Yes -> OCI ARM (not Render/Fly)
-> No / can tolerate cold starts -> Render + keep-alive pinger

**Storing user uploads?**
-> Cloudflare R2 (always, unless HIPAA)

**Auth with Google OAuth?**
-> NextAuth.js (unlimited) or Supabase Auth (50k MAU)

**Need search?**
-> Has OCI? Self-host Typesense. No OCI? Use Algolia free tier.

**Need email?**
-> Resend (best DX) or Brevo (highest volume)

**Need SMS?**
-> Replace with email OTP or TOTP - no truly free option exists.

---

## Watch Out For

- **Render PostgreSQL** - expires 30 days after creation, not production-safe
- **Render/Fly sleep** - 15-30 min idle spin-down destroys UX and SEO (crawlers get blocked)
- **AWS S3 egress** - $0.09/GB out; R2 = $0 egress
- **Auth0 7,500 MAU cap** - easy to exceed in a growing app
- **GitHub Actions private repo minutes** - 2,000/mo sounds like a lot until you add matrix builds
- **Free TLDs (.tk/.ml)** - effectively dead in 2026, don't rely on them
- **Vendor lock-in** - always abstract external services behind interfaces so swapping is painless
