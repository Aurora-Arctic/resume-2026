.PHONY: docker-build docker-up docker-down docker-rebuild docker-update-token docker-logs \
	npm-install npm-develop npm-build npm-serve npm-clean npm-lint npm-lint-fix \
	npm-format npm-format-check npm-test npm-test-watch npm-test-e2e

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

npm-test:
	npm test

npm-test-watch:
	npm run test:watch

npm-test-e2e:
	npm run test:e2e
