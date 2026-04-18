.PHONY: help install dev-backend dev-frontend test test-backend test-frontend eval lint format docker-build docker-up docker-down

help:
	@echo "Hero Slot Studio - common commands"
	@echo ""
	@echo "  make install         Install backend + frontend deps"
	@echo "  make dev-backend     Run FastAPI with --reload on :8787"
	@echo "  make dev-frontend    Run Vite dev server on :5173"
	@echo "  make test            Run all tests (backend + frontend)"
	@echo "  make eval            Run the eval set (python -m evals.runner)"
	@echo "  make lint            Lint backend (ruff) + frontend (eslint)"
	@echo "  make format          Format backend (ruff format) + frontend (prettier)"
	@echo "  make docker-build    Build production image"
	@echo "  make docker-up       docker compose up --build"
	@echo "  make docker-down     docker compose down"

install:
	pip install -e ".[dev]"
	playwright install chromium
	cd frontend && npm install

dev-backend:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8787

dev-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	pytest

test-frontend:
	cd frontend && npm test -- --run

eval:
	python -m evals.runner

lint:
	ruff check .
	cd frontend && npm run lint

format:
	ruff format .
	cd frontend && npx prettier --write .

docker-build:
	docker build -t hero-slot-studio:local .

docker-up:
	docker compose up --build

docker-down:
	docker compose down
