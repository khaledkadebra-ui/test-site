FROM python:3.12-slim

WORKDIR /app

# System deps for WeasyPrint (PDF generation)
# libgdk-pixbuf2.0-0 was renamed to libgdk-pixbuf-xlib-2.0-0 in Debian Trixie
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
