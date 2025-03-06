#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p /app/data

# Run Django migrations
python manage.py migrate

# Synchronize notes from Qdrant to Django
python manage.py sync_from_qdrant

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn
gunicorn --timeout 300 --workers 1 --bind 0.0.0.0:8000 app.wsgi:application 