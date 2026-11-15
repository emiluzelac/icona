# icona

The `@emiluzelac/icona` React icon package lives in [`icona/`](icona/README.md), with its preview site in `icona/examples/preview`.

## Where this lives

This repository is developed in a private Forgejo and mirrored here: every commit
and tag on GitHub arrives from there. Issues and pull requests are welcome on
GitHub; an accepted change is applied on Forgejo and comes back through the mirror,
so nothing is merged here directly.

CI runs from `.forgejo/workflows/`, and dependency updates come from Renovate (`renovate.json`), not Dependabot. A push to `main` rebuilds the preview site on Vercel from the mirrored copy; A `v*` tag that matches `icona/package.json` publishes `@emiluzelac/icona` to npm from `.forgejo/workflows/publish.yml` on Forgejo.
