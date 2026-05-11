# Docker Setup Guide

This project uses **Docker Compose** to run both the backend and frontend together in isolated containers.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Docker Engine `v20.10+` and Docker Compose `v2.0+`

Verify installation:
```bash
docker --version
docker compose version
```

---

## Project Structure

```
.
├── docker-compose.yml      # Orchestrates all services
├── backend/                # Backend service (port 8080)
│   ├── dockerfile
│   └── ...
└── frontend/               # Next.js frontend (port 3000)
    ├── Dockerfile
    └── ...
```

---

## Quick Start

### 1. Start all services

```bash
docker compose up --build -d
```

- `--build` : Rebuild images (use after Dockerfile changes)
- `-d`      : Run in background (detached mode)

### 2. Access the application

| Service  | URL                     |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:8080  |

### 3. View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### 4. Stop all services

```bash
# Stop and keep data
docker compose down

# Stop and remove all data (volumes)
docker compose down -v
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose ps` | List running containers |
| `docker compose up` | Start services (foreground) |
| `docker compose up -d` | Start services (background) |
| `docker compose up --build` | Rebuild and start |
| `docker compose down` | Stop and remove containers |
| `docker compose restart <service>` | Restart a specific service |
| `docker compose exec backend sh` | Open shell inside backend container |
| `docker compose exec frontend sh` | Open shell inside frontend container |

---

## Troubleshooting

### Port already in use
```
Error: bind: address already in use
```
**Fix:** Something is using port `8080` or `3000`. Either stop that service or change the port in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"   # Use 8081 on host instead
```

### Frontend can't reach backend
If you see `ECONNREFUSED` or `Failed to fetch` in the frontend logs, check:
1. Backend is running: `docker compose ps`
2. Backend logs for errors: `docker compose logs backend`
3. The `NEXT_PUBLIC_API_URL` environment variable is set correctly

### Changes not reflecting (no hot reload)
For development with live code reloading, make sure your `docker-compose.yml` includes volume mounts:
```yaml
volumes:
  - ./frontend:/app
  - /app/node_modules
```

### Permission denied (Linux)
```bash
sudo usermod -aG docker $USER
newgrp docker
```
Then restart Docker Desktop.

---

## Services Overview

### Backend
- **Port:** `8080`
- **Build:** `./backend/dockerfile`
- **Volumes:**
  - `./backend/database` → `/app/database`
  - `./backend/uploads` → `/app/uploads`

### Frontend
- **Port:** `3000`
- **Build:** `./frontend/Dockerfile`
- **Environment:**
  - `NEXT_PUBLIC_API_URL=http://localhost:8080`
- **Depends on:** Backend (starts after backend)

---

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Frontend | URL the frontend uses to call the backend API |

---

## Rebuild from Scratch

If you want a completely clean start:

```bash
docker compose down -v          # Remove containers + volumes
docker compose up --build -d    # Rebuild and start fresh
```

---

## Need Help?

1. Check logs: `docker compose logs -f <service>`
2. Verify Docker is running: `docker ps`
3. Check the [Docker Docs](https://docs.docker.com/compose/)
