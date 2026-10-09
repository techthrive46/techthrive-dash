# Backend helper commands. Run `make help` to list them.
# Uses the local venv (Windows or POSIX layout) if present, otherwise system python.

ifneq ($(wildcard venv/Scripts/python.exe),)
PYTHON ?= venv/Scripts/python.exe
else ifneq ($(wildcard venv/bin/python),)
PYTHON ?= venv/bin/python
else
PYTHON ?= python
endif

MANAGE  = $(PYTHON) manage.py
PORT   ?= 8000
COMPOSE = docker compose -f ../docker-compose.yml

.DEFAULT_GOAL := help
.PHONY: help venv install run migrations migrate superuser shell test check static \
        docker-up docker-down docker-logs docker-build docker-shell docker-migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-16s %s\n", $$1, $$2}'

venv: ## Create the local virtualenv
	python -m venv venv

install: ## Install dependencies from requirements.txt
	$(PYTHON) -m pip install -r requirements.txt

run: ## Start the dev server (PORT=8000)
	$(MANAGE) runserver $(PORT)

migrations: ## Create new migrations
	$(MANAGE) makemigrations

migrate: ## Apply migrations
	$(MANAGE) migrate

superuser: ## Create a Django superuser
	$(MANAGE) createsuperuser

shell: ## Open the Django shell
	$(MANAGE) shell

test: ## Run the test suite
	$(MANAGE) test

check: ## Run Django system checks
	$(MANAGE) check

static: ## Collect static files
	$(MANAGE) collectstatic --noinput

docker-build: ## Build docker images
	$(COMPOSE) build

docker-up: ## Start db + backend containers (detached)
	$(COMPOSE) up -d

docker-down: ## Stop containers
	$(COMPOSE) down

docker-logs: ## Tail backend container logs
	$(COMPOSE) logs -f backend

docker-shell: ## Shell into the backend container
	$(COMPOSE) exec backend sh

docker-migrate: ## Run migrations inside the backend container
	$(COMPOSE) exec backend python manage.py migrate
