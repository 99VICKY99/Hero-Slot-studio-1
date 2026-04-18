# syntax=docker/dockerfile:1.6

# Stage 1: build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: backend + static assets
# LOCKED: do not change base image without architectural review (CLAUDE.md §20)
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy AS runtime

# Non-root user
RUN useradd --create-home --shell /bin/bash app
WORKDIR /app

# Install backend first for better caching
COPY pyproject.toml ./
COPY backend ./backend
RUN pip install --no-cache-dir .

# Frontend build output
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Evals and scripts
COPY evals ./evals
COPY scripts ./scripts

RUN chown -R app:app /app
USER app

EXPOSE 8787
CMD ["python", "-m", "backend.main"]
