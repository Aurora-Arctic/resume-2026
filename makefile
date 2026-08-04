build:
	docker compose -f Docker/docker-compose.yaml build

up: update-token
	docker compose -f Docker/docker-compose.yaml up -d

down:
	docker compose -f Docker/docker-compose.yaml down

rebuild: update-token
	docker compose -f Docker/docker-compose.yaml down -v && docker compose -f Docker/docker-compose.yaml up --build -d

update-token:
	./Docker/update-token.sh

logs:
	docker compose -f Docker/docker-compose.yaml logs -f