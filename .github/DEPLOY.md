# GitHub Pages deployment

This workflow builds the HTML books (`npm run build` → `docs/`) and deploys them via **GitHub Actions**. The site is served from the deployment, not from a branch.

## One-time setup: Pages source

1. Open **Settings** → **Pages**: https://github.com/lagleki/books/settings/pages  
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**.

After that, every push to `main` (and manual runs) will build and deploy; the live site will always show the latest built books.

## Flow

1. **build** job: checkout → `npm ci` → `npm run build` → upload `./docs` as a Pages artifact.  
2. **deploy** job: deploys that artifact to GitHub Pages.  
3. The site at https://lagleki.github.io/books/ is served from this deployment.

No `gh-pages` branch or folder setting is required.
