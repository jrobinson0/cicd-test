# GitHub Actions CI/CD — Setup Checklist

The pipeline in `.github/workflows/ci.yml` runs four jobs in sequence on every push/PR to `main`:

```
eslint → sonarqube → docker (build & push to GHCR) → playwright (e2e)
```

`eslint` and `playwright` work out of the box with no configuration. `sonarqube` and `docker`
need one-time setup in the GitHub web UI before they'll pass. Until you do this, those two jobs
will fail (or be skipped) — that's expected, not a bug in the code.

## 1. SonarQube (or SonarCloud) — required secrets

The `sonarqube` job needs two repository secrets: `SONAR_TOKEN` and `SONAR_HOST_URL`.

You have two options:

### Option A — SonarCloud (SaaS, easiest)

> Note: SonarCloud's free tier only covers **public** repositories. Since `cicd-test` is
> private, you'd need a paid SonarCloud plan, or make the repo public, or use Option B instead.

1. Go to https://sonarcloud.io and sign in with your GitHub account (`jrobinson0`).
2. Click **+ → Analyze new project**, select the `cicd-test` repository, and follow the import
   wizard. Note the **Organization Key** it assigns you.
3. Open `sonar-project.properties` in this repo and add a line:
   ```
   sonar.organization=<your-organization-key>
   ```
4. In SonarCloud: **My Account → Security → Generate Token**. Copy the token.
5. In GitHub: go to
   `https://github.com/jrobinson0/cicd-test/settings/secrets/actions`
   and add two **repository secrets**:
   - `SONAR_TOKEN` = the token you just generated
   - `SONAR_HOST_URL` = `https://sonarcloud.io`

### Option B — Self-hosted SonarQube

If you'd rather run your own SonarQube server (e.g. via Docker on a VM you control):

1. Stand up a SonarQube instance (e.g. `docker run -d -p 9000:9000 sonarqube:community`) and
   make sure it's reachable from the internet (GitHub-hosted runners need to reach it — a
   local-only server on your laptop will not work unless you use a self-hosted runner).
2. Log in, create a project manually, and generate a token under
   **My Account → Security → Generate Token**.
3. In GitHub, add repository secrets at
   `https://github.com/jrobinson0/cicd-test/settings/secrets/actions`:
   - `SONAR_TOKEN` = the token from your server
   - `SONAR_HOST_URL` = the URL of your server (e.g. `https://sonarqube.example.com`)

## 2. Docker images → GitHub Container Registry (GHCR)

The `docker` job builds both images and pushes them to `ghcr.io` using the built-in
`GITHUB_TOKEN` — **no extra secret or account needed** — but the token needs write access first:

1. Go to `https://github.com/jrobinson0/cicd-test/settings/actions`.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Save.

Without this, the `docker` job will fail on the `docker/login-action` or push step with a
permissions error.

Once a push to `main` succeeds, the images will appear at:
- `ghcr.io/jrobinson0/cicd-test-backend:latest`
- `ghcr.io/jrobinson0/cicd-test-frontend:latest`

By default new GHCR packages are **private**. To view or manage them:

1. Go to `https://github.com/jrobinson0?tab=packages`.
2. Click into each package → **Package settings** to change visibility or link it to the repo
   (**Connect Repository**) so it shows up in the repo's sidebar.

## 3. Playwright job

No setup needed. It installs Chromium, starts both the backend and frontend, waits for them to
be ready, and runs the tests in `e2e/`. If it fails, a `playwright-report` artifact is uploaded
to the workflow run (Actions tab → the run → **Artifacts**) with full traces/screenshots.

## Summary of what to do right now

- [ ] Decide: SonarCloud (needs paid plan for a private repo) or self-hosted SonarQube
- [ ] Add `SONAR_TOKEN` and `SONAR_HOST_URL` repository secrets
- [ ] If using SonarCloud, add `sonar.organization=...` to `sonar-project.properties`
- [ ] Set **Workflow permissions** to "Read and write" so Docker images can push to GHCR
- [ ] Push/open a PR to trigger the pipeline and confirm all four jobs go green
