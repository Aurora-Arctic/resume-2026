.PHONY: docker-build docker-up docker-down docker-rebuild docker-update-token docker-logs \
	npm-install npm-develop npm-build npm-serve npm-clean npm-lint npm-lint-fix \
	npm-format npm-format-check npm-pre-commit npm-test npm-test-watch npm-test-coverage \
	npm-test-e2e npm-test-e2e-coverage \
	act-image act-cache-checkout act-cache-artifact act-lint act-format act-typecheck act-vitest act-build act-playwright act-test

npm-install:
	npm install

npm-develop:
	npm run develop

npm-build:
	npm run build

npm-serve:
	npm run serve

npm-clean:
	npm run clean

npm-lint:
	npm run lint

npm-lint-fix:
	npm run lint:fix

npm-format:
	npm run format

npm-format-check:
	npm run format:check

npm-pre-commit:
	npm run pre-commit

npm-test:
	npm test

npm-test-watch:
	npm run test:watch

npm-test-coverage:
	npm run test:coverage

npm-test-e2e:
	npm run test:e2e

npm-test-e2e-coverage:
	npm run test:e2e:coverage

# Host-level (not devcontainer-integrated)

docker-build:
	docker compose -f Docker/docker-compose.yaml build

docker-up: docker-update-token
	docker compose -f Docker/docker-compose.yaml up -d

docker-down:
	docker compose -f Docker/docker-compose.yaml down

docker-rebuild: docker-update-token
	docker compose -f Docker/docker-compose.yaml down -v && docker compose -f Docker/docker-compose.yaml up --build -d

docker-update-token:
	./Docker/update-token.sh

docker-logs:
	docker compose -f Docker/docker-compose.yaml logs -f

# See "Local CI testing with act" in
# CI-SETUP.md. Runs the real per-check .github/workflows/*.yml files via `act` against
# a locally-built image, so failures surface before pushing rather than only in
# pr-gate. `audit` and `build-image` are deliberately not included — see CI-SETUP.md
# for why.
ACT_IMAGE := resume-2026-testing:local
ACT_CHECKOUT_CACHE := $(HOME)/.cache/act/mjoynes-wombat-web-resume-2026-.github-actions-checkout-to-app@main
ACT_ARTIFACT_CACHE := $(HOME)/.cache/act/actions-upload-artifact@v7

act-image:
	docker build -f Docker/Dockerfile.node --target testing -t $(ACT_IMAGE) .

# Every job's first step resolves checkout-to-app via a remote
# owner/repo/path@main ref (not a local ./ path), so act needs a real clone of
# this repo's main branch at its expected cache path — see CI-SETUP.md. Only
# clones the first time per machine / whenever ~/.cache/act is cleared.
act-cache-checkout:
	@[ -d "$(ACT_CHECKOUT_CACHE)" ] || \
		git clone --branch main https://github.com/mjoynes-wombat-web/resume-2026 "$(ACT_CHECKOUT_CACHE)"

# actions/upload-artifact@v7 needs to be a real git checkout (not a flat copy) at
# act's expected cache path, since act resolves the v7 tag through it — see
# CI-SETUP.md. Only clones the first time per machine / whenever ~/.cache/act is
# cleared. Both act-vitest and act-playwright now upload a coverage artifact
# (vitest.yml/playwright.yml), so both depend on this — it used to be
# act-playwright-only, seeded at the (by-then-stale) v4 tag.
act-cache-artifact:
	@[ -d "$(ACT_ARTIFACT_CACHE)" ] || \
		git clone --depth 1 --branch v7 https://github.com/actions/upload-artifact "$(ACT_ARTIFACT_CACHE)"

act-lint: act-image act-cache-checkout
	act -W .github/workflows/lint.yml -j lint --input image=$(ACT_IMAGE) -s GITHUB_TOKEN=dummy-token --action-offline-mode

act-format: act-image act-cache-checkout
	act -W .github/workflows/format.yml -j format --input image=$(ACT_IMAGE) -s GITHUB_TOKEN=dummy-token --action-offline-mode

act-typecheck: act-image act-cache-checkout
	act -W .github/workflows/typecheck.yml -j typecheck --input image=$(ACT_IMAGE) -s GITHUB_TOKEN=dummy-token --action-offline-mode

act-vitest: act-image act-cache-checkout act-cache-artifact
	act -W .github/workflows/vitest.yml -j vitest --input image=$(ACT_IMAGE) -s GITHUB_TOKEN=dummy-token --action-offline-mode

act-build: act-image act-cache-checkout
	act -W .github/workflows/build.yml -j build --input image=$(ACT_IMAGE) -s GITHUB_TOKEN=dummy-token --action-offline-mode

act-playwright: act-image act-cache-checkout act-cache-artifact
	act -W .github/workflows/playwright.yml -j playwright --input image=$(ACT_IMAGE) -s GITHUB_TOKEN=dummy-token --action-offline-mode

act-test: act-lint act-format act-typecheck act-vitest act-build act-playwright
