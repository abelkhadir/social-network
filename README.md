# Social Network

A full-stack social network application built with:

- Go for the backend
- Next.js for the frontend
- SQLite for storage
- Docker for containerized development

## Services

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

## Project Structure

```text
social-network/
├── backend/
│   ├── database/
│   ├── sql/
│   ├── uploads/
│   ├── dockerfile
│   └── main.go
├── frontend/
│   ├── app/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Requirements

For local development:

- Go `1.25+`
- Node.js `22+`
- npm

For Docker:

- Docker
- Docker Compose

## Run Locally

### Backend

The backend uses [backend/.env](/home/abelkhadir/social-network/backend/.env) and stores data in `backend/database/socialdb.db`.

```bash
cd /home/abelkhadir/social-network/backend
go mod download
go run .
```

### Frontend

```bash
cd /home/abelkhadir/social-network/frontend
npm install
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Build Locally

### Backend

```bash
cd /home/abelkhadir/social-network/backend
go build ./...
```

### Frontend

```bash
cd /home/abelkhadir/social-network/frontend
npm run build
```

## Run With Docker

From the project root:

### Newer Docker Compose syntax

```bash
cd /home/abelkhadir/social-network
docker compose up --build
```

### Older Docker Compose syntax

```bash
cd /home/abelkhadir/social-network
docker-compose up --build
```

### Detached mode

```bash
docker compose up -d --build
```

or:

```bash
docker-compose up -d --build
```

### Stop containers

```bash
docker compose down
```

or:

```bash
docker-compose down
```

### View logs

```bash
docker compose logs -f
```

or:

```bash
docker-compose logs -f
```

### List containers

```bash
docker ps -a
```

## Docker Notes

- The backend database is persisted through `./backend/database:/app/database`
- Uploaded files are persisted through `./backend/uploads:/app/uploads`
- The frontend container uses `NEXT_PUBLIC_API_URL=http://localhost:8080`

## Troubleshooting

### Docker daemon not running

If you see:

```text
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

start Docker, then retry:

```bash
docker ps -a
docker-compose up --build
```

### `unknown flag: --build`

If `docker compose up --build` fails with:

```text
unknown flag: --build
```

use:

```bash
docker-compose up --build
```

### Frontend build check

```bash
cd /home/abelkhadir/social-network/frontend
npm run build
```

### Backend build check

```bash
cd /home/abelkhadir/social-network/backend
go build ./...
```
