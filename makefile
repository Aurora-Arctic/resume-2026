build:
	docker compose -f Docker/docker-compose.yaml build

up:
	docker compose -f Docker/docker-compose.yaml up -d