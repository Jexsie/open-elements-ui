# Deploying the component showcase

The showcase is the static Storybook build from this repository, served by nginx and put behind
Authentik SSO. Nothing about the published npm package is involved.

- **Image:** built from [`Dockerfile`](../Dockerfile) — `node:24-alpine` runs `pnpm build-storybook`,
  `nginx:stable-alpine` serves `storybook-static/` on port 80.
- **nginx config:** [`.docker/nginx.conf`](../.docker/nginx.conf). Hashed assets under `/assets/`
  are cached for a year, `.html` and `.json` are `no-cache`, and `/healthz` returns `200 ok`.
- **Access control:** enforced in the reverse proxy, not in the application. The build has no
  awareness of it.

Verify the image locally before touching Coolify:

```bash
docker build -t oe-ui-showcase .
docker run --rm -p 8080:80 oe-ui-showcase
curl -fsS http://localhost:8080/healthz          # ok
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/   # 200
```

## 1. The Coolify application

Create an **Application** in the project of your choice:

| Setting | Value |
|---|---|
| Source | this Git repository |
| Branch | `main` |
| Build pack | **Dockerfile** |
| Dockerfile location | `/Dockerfile` |
| Base directory | `/` |
| Port | `80` |
| Health check path | `/healthz` |
| Domain | the showcase hostname (see [Open questions](#open-questions)) |

A Dockerfile rather than the static build pack, so the build command and the publish directory stay
in version control and are reproducible locally.

Enable **auto-deploy** so a push to `main` redeploys. Coolify does this with a GitHub webhook: either
connect the repository through a Coolify GitHub App, or copy the application's webhook URL into
*Settings → Webhooks* on the repository. The `.dockerignore` keeps `node_modules`, `dist` and
`storybook-static` out of the build context, so a deployment never picks up a stale local build.

The first deployment should be checked **before** the auth middleware goes on — an unreachable
container and a working middleware in front of a broken one look identical from the browser.

## 2. The Authentik provider

In Authentik:

1. **Applications → Providers → Create → Proxy Provider**
   - Name: `showcase`
   - Authorization flow: your usual `default-provider-authorization-implicit-consent`
   - Mode: **Forward auth (single application)**
   - External host: `https://<showcase-hostname>` — exactly the domain configured in Coolify,
     including the scheme. A mismatch here sends users into a redirect loop.
2. **Applications → Applications → Create**
   - Slug: `showcase`, Provider: the provider above.
3. **Bind the group.** On the application, add a policy binding for the group that is allowed in
   (create one, e.g. `ui-showcase`, and add the two consumer teams). Without a binding every
   authenticated user gets in, which defeats the point of using SSO over a shared password.
4. **Outposts → the embedded outpost** → add the new application to it.

## 3. Wiring the proxy

Which of the two sections below applies depends on what the Coolify instance proxies with — see
[Open questions](#open-questions). Both assume Authentik is reachable at `authentik-server:9000`;
if it is not on a shared Docker network with the showcase container, substitute its public URL
(`https://auth.<domain>`) everywhere `http://authentik-server:9000` appears.

Two routes are always needed:

- `/outpost.goauthentik.io/*` → the Authentik outpost, so the login handshake and the callback can
  complete on the showcase's own hostname.
- everything else → the showcase container, guarded by the forward-auth middleware.

Because the middleware guards the whole host and the session cookie is set on that host,
`iframe.html` and every hashed asset are covered by the same session. No extra rules are needed for
them.

### Traefik

Add these as **custom labels** on the Coolify application (replace `ui.example.com`). Coolify manages
`traefik.enable` and the TLS resolver for the main router itself; keep its generated labels and add
these alongside.

```
traefik.http.middlewares.authentik.forwardAuth.address=http://authentik-server:9000/outpost.goauthentik.io/auth/traefik
traefik.http.middlewares.authentik.forwardAuth.trustForwardHeader=true
traefik.http.middlewares.authentik.forwardAuth.authResponseHeaders=X-authentik-username,X-authentik-groups,X-authentik-entitlements,X-authentik-email,X-authentik-name,X-authentik-uid,X-authentik-jwt,X-authentik-meta-jwks,X-authentik-meta-outpost,X-authentik-meta-provider,X-authentik-meta-app,X-authentik-meta-version

traefik.http.routers.showcase.rule=Host(`ui.example.com`)
traefik.http.routers.showcase.entryPoints=https
traefik.http.routers.showcase.tls.certresolver=letsencrypt
traefik.http.routers.showcase.middlewares=authentik@docker

traefik.http.routers.showcase-outpost.rule=Host(`ui.example.com`) && PathPrefix(`/outpost.goauthentik.io/`)
traefik.http.routers.showcase-outpost.entryPoints=https
traefik.http.routers.showcase-outpost.tls.certresolver=letsencrypt
traefik.http.routers.showcase-outpost.service=authentik
traefik.http.routers.showcase-outpost.priority=15

traefik.http.services.authentik.loadbalancer.server.url=http://authentik-server:9000
```

The outpost router needs the higher `priority`: its rule is a strict subset of the showcase rule, and
without it Traefik may pick the guarded router for the callback path and loop.

### Caddy

Caddy has no label interface; the routes go into the site block Coolify generates for the domain
(*Configuration → Advanced → Custom Caddy configuration*):

```caddyfile
ui.example.com {
    handle /outpost.goauthentik.io/* {
        reverse_proxy http://authentik-server:9000
    }

    handle {
        forward_auth http://authentik-server:9000 {
            uri /outpost.goauthentik.io/auth/caddy
            copy_headers X-Authentik-Username X-Authentik-Groups X-Authentik-Entitlements X-Authentik-Email X-Authentik-Name X-Authentik-Uid X-Authentik-Jwt X-Authentik-Meta-Jwks X-Authentik-Meta-Outpost X-Authentik-Meta-Provider X-Authentik-Meta-App X-Authentik-Meta-Version
            trusted_proxies private_ranges
        }

        reverse_proxy showcase:80
    }
}
```

Note the endpoint differs from Traefik's: `/auth/caddy`, not `/auth/traefik`.

## 4. Verification

- [ ] A push to `main` triggers a Coolify deployment and the new build is served.
- [ ] A visitor with no session requesting any path lands on the Authentik login flow.
- [ ] A member of the bound group completes login and is returned to the requested path.
- [ ] A user outside the bound group is refused and never receives the page.
- [ ] Opening a story loads `iframe.html` and its assets with no second login prompt.
- [ ] `/healthz` answers `200` for Coolify's probe.

## Operational notes

- **An expired session inside the story iframe.** Storybook renders each story in a same-origin
  `<iframe>`. If the session expires while the tab is open, that frame receives a redirect to
  Authentik, which refuses to be framed — the story area goes blank rather than showing a login
  page. Reloading the top-level page fixes it. Raising the Authentik session duration reduces how
  often anyone meets it.
- **Base images are tag-pinned, not digest-pinned.** `node:24-alpine` matches `.nvmrc`;
  `nginx:stable-alpine` tracks the nginx stable branch. Pin digests if the deployment ever needs to
  be bit-for-bit reproducible across time.
- **`build-storybook` is deliberately not in CI.** It would roughly double pipeline time to guard
  tooling. The Coolify build is the thing that catches a broken story build today — a failed
  deployment is the signal.

## Open questions

These are environment facts, not decisions, and they are the reason section 3 documents two variants:

- **The hostname**, and who creates the DNS record for it.
- **Traefik or Caddy** on the Coolify instance — it decides which half of section 3 applies.
- **Whether Authentik and the showcase container share a Docker network.** If they do not, every
  `http://authentik-server:9000` above becomes Authentik's public URL.
