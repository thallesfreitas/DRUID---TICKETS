# Makefile - PromoCode Docker Commands

.PHONY: help build start stop restart status logs log-app log-redis redis-cli clean rebuild test health

help:
	@echo "🐳 PromoCode Docker Commands"
	@echo ""
	@echo "Build & Start:"
	@echo "  make build          - Build Docker image"
	@echo "  make start          - Start all containers"
	@echo "  make stop           - Stop all containers"
	@echo "  make restart        - Restart containers"
	@echo "  make rebuild        - Rebuild everything from scratch"
	@echo ""
	@echo "Monitoring:"
	@echo "  make status         - Show containers status"
	@echo "  make logs           - Show all logs (live)"
	@echo "  make log-app        - Show app logs (live)"
	@echo "  make log-redis      - Show Redis logs (live)"
	@echo "  make health         - Check health of services"
	@echo ""
	@echo "Redis:"
	@echo "  make redis-cli      - Connect to Redis CLI"
	@echo "  make redis-flush    - Flush Redis database"
	@echo ""
	@echo "Development:"
	@echo "  make shell-app      - Open shell in app container"
	@echo "  make npm            - Run npm commands (usage: make npm ARGS='install')"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          - Clean up Docker resources"
	@echo "  make test           - Run tests in container"
	@echo ""

build:
	@echo "🐳 Building Docker image..."
	bash docker-scripts/build.sh

start:
	@echo "▶️  Starting containers..."
	bash docker-scripts/start.sh

stop:
	@echo "⏹️  Stopping containers..."
	bash docker-scripts/stop.sh

restart: stop start
	@echo "✅ Containers restarted"

rebuild:
	@echo "🔄 Rebuilding everything..."
	bash docker-scripts/rebuild.sh

status:
	@echo "📊 Container status:"
	bash docker-scripts/status.sh

logs:
	@echo "📋 Showing all logs..."
	bash docker-scripts/logs.sh

log-app:
	@echo "📋 Showing app logs..."
	bash docker-scripts/logs.sh app

log-redis:
	@echo "📋 Showing Redis logs..."
	bash docker-scripts/logs.sh redis

health:
	@echo "🏥 Checking health..."
	@docker-compose exec app curl -s http://localhost:3000/api/health | jq . || echo "App not healthy"
	@docker-compose exec redis redis-cli -a redis123 ping 2>/dev/null && echo "Redis: OK" || echo "Redis: Not responding"

redis-cli:
	@echo "🔴 Connecting to Redis..."
	bash docker-scripts/redis-cli.sh

redis-flush:
	@echo "🧹 Flushing Redis..."
	@docker-compose exec redis redis-cli -a redis123 FLUSHALL
	@echo "✅ Redis flushed"

shell-app:
	@echo "📦 Opening app shell..."
	docker-compose exec app sh

npm:
	@echo "📦 Running npm $(ARGS)..."
	docker-compose exec app npm $(ARGS)

clean:
	@echo "🧹 Cleaning up..."
	bash docker-scripts/clean.sh

test:
	@echo "🧪 Running tests..."
	docker-compose exec app npm test

ps:
	@docker-compose ps

pull:
	docker-compose pull

push:
	@echo "📤 Pushing image to registry..."
	docker push promocode:latest

version:
	@docker --version
	@docker-compose --version

env-setup:
	@echo "📝 Setting up .env.docker..."
	@if [ ! -f .env.docker ]; then \
		cp .env.docker.example .env.docker; \
		echo "✅ Created .env.docker"; \
		echo "⚠️  Please update with your credentials"; \
	else \
		echo "⚠️  .env.docker already exists"; \
	fi

.DEFAULT_GOAL := help
