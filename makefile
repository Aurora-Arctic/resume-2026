build:
	docker compose -f Docker/docker-compose.yaml build

up:
	docker compose -f Docker/docker-compose.yaml up -d

down:
	docker compose -f Docker/docker-compose.yaml down

rebuild:
	docker compose -f Docker/docker-compose.yaml down -v && docker compose -f Docker/docker-compose.yaml up --build -d

logs:
	docker compose -f Docker/docker-compose.yaml logs -f