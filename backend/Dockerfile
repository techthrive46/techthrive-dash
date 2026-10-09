FROM python:3.12-slim

# Lets the same image run on AWS Lambda: the adapter forwards Lambda events to
# gunicorn over HTTP. It only activates inside Lambda; docker compose and any
# other container host ignore it.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
# Lambda Web Adapter: where the app listens and what it polls before the first request.
ENV AWS_LWA_PORT=8000
ENV AWS_LWA_READINESS_CHECK_PATH=/api/health/

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files at build time: Lambda's filesystem is read-only, and it
# keeps cold starts fast. The key is a throwaway used only for this step.
RUN DEBUG=False SECRET_KEY=collectstatic-build-only python manage.py collectstatic --noinput

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
# WEB_CONCURRENCY: Lambda sends one request at a time per instance, so it uses 1 worker.
CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --timeout 60"]
