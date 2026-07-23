# GitHub Actions CI/CD — Setup Checklist

The pipeline in `.github/workflows/ci.yml` runs four jobs in sequence on every push/PR to `main`:

```
eslint → sonarqube → docker (build & push to GHCR) → playwright (e2e)
```

`eslint` and `playwright` work out of the box with no configuration. `sonarqube` and `docker`
need one-time setup in the GitHub/SonarCloud web UI before they'll pass. Until you do this,
those two jobs will fail — that's expected, not a bug in the code.

## 1. SonarCloud setup

We're using **SonarCloud** (SonarSource's hosted SaaS), which is free for public repos — this
repo was switched to public for that reason.

1. Go to https://sonarcloud.io and click **Log in**, then choose **GitHub** and authorize with
   your `jrobinson0` account.
2. Click **+ (top right) → Analyze new project**.
3. Pick your GitHub organization/account, then select the `cicd-test` repository, and click
   **Set Up**.
4. Choose **"With GitHub Actions"** as the analysis method when prompted (not the "Automatic
   Analysis" option — this repo already has its own workflow driving the scan).
5. SonarCloud will show you the exact **Organization Key** and **Project Key** it assigned.
   Open `sonar-project.properties` in this repo and make sure these two lines match exactly
   what SonarCloud displayed:
   ```
   sonar.projectKey=<the project key SonarCloud shows you>
   sonar.organization=<the organization key SonarCloud shows you>
   ```
   They're currently pre-filled with a best guess (`jrobinson0_cicd-test` / `jrobinson0`) — if
   SonarCloud generated something different, update the file and commit the change.
6. Generate a token: **My Account (avatar, top right) → Security → Generate Token**. Name it
   something like `cicd-test-gha`, and copy it (you won't be able to see it again).
7. In GitHub, go to
   `https://github.com/jrobinson0/cicd-test/settings/secrets/actions` and add one
   **repository secret**:
   - `SONAR_TOKEN` = the token you just copied

   (The host URL is already hardcoded to `https://sonarcloud.io` in the workflow, so no
   `SONAR_HOST_URL` secret is needed.)

8. **Turn off Automatic Analysis.** Even when you pick "With GitHub Actions" during import,
   SonarCloud sometimes leaves Automatic Analysis enabled too, which makes the CI scan fail
   with `ERROR You are running CI analysis while Automatic Analysis is enabled.` Go to your
   project on sonarcloud.io → **Administration → Analysis Method** and switch the "Automatic
   Analysis" toggle **off**, leaving only the GitHub Actions analysis active.

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

New GHCR packages default to **private** even though the repo is public. To view or manage them:

1. Go to `https://github.com/jrobinson0?tab=packages`.
2. Click into each package → **Package settings** to change visibility or link it to the repo
   (**Connect Repository**) so it shows up in the repo's sidebar.

## 3. Playwright job

No setup needed. It installs Chromium, starts both the backend and frontend, waits for them to
be ready, and runs the tests in `e2e/`. If it fails, a `playwright-report` artifact is uploaded
to the workflow run (Actions tab → the run → **Artifacts**) with full traces/screenshots.

## Summary of what to do right now

- [x] Repo made public (required for SonarCloud's free tier)
- [ ] Import the project in SonarCloud ("With GitHub Actions" analysis method)
- [ ] Confirm/update `sonar.projectKey` and `sonar.organization` in `sonar-project.properties`
- [ ] Add the `SONAR_TOKEN` repository secret
- [ ] Turn off "Automatic Analysis" in SonarCloud project Administration settings
- [ ] Set **Workflow permissions** to "Read and write" so Docker images can push to GHCR
- [ ] Push/open a PR to trigger the pipeline and confirm all four jobs go green
