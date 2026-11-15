# MQube API server (FastAPI). Built and run by deploy/docker-compose.prod.yml.
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt production.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x entrypoint.sh && mkdir -p /app/app/certs && useradd --create-home mqube && chown -R mqube /app
USER mqube

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
