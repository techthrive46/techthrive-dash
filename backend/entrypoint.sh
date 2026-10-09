#!/bin/sh
set -e

# On Lambda, migrations run once per deploy in CI (see deploy/README.md),
# not on every cold start, and static files are collected at build time.
if [ -z "$AWS_LAMBDA_FUNCTION_NAME" ]; then
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput
fi

exec "$@"
