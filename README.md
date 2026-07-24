# gitmanantique.com

Website for **Gitman Antique Watches &amp; Rarities** — a premier horological leader for over 40 years, buying, selling, repairing and appraising antique watches and clocks.

*Moving Time Around the World.*

## Contents

- `index.html` — the complete single-page site (self-contained; fonts loaded from Google Fonts).
- `CNAME` — custom domain configuration for GitHub Pages (`gitmanantique.com`).
- `.nojekyll` — tells GitHub Pages to serve the files as-is without Jekyll processing.

## Publishing with GitHub Pages

1. Push this branch and open a pull request (or merge to your default branch).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
4. Choose the branch that contains this site and the `/ (root)` folder, then **Save**.
5. Under **Custom domain**, confirm `gitmanantique.com` (the `CNAME` file sets this automatically).
6. Point your domain's DNS at GitHub Pages:
   - An **ALIAS/ANAME** or four **A** records for the apex `gitmanantique.com` →
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - A **CNAME** for `www` → `dgitman.github.io`
7. Enable **Enforce HTTPS** once the certificate is issued.

## Contact

Howard Gitman · 212-579-9830 · info@gitmanantique.com
