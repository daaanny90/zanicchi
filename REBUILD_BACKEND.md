# 🔨 How to Rebuild Backend After Code Changes

## The Problem
When you change backend code (TypeScript files), Docker containers need to be rebuilt 
to include the new code. Otherwise, they keep running the old code.

## Quick Rebuild

Run this command:

```bash
cd ~/Personal/Projects/zanicchi
./rebuild-backend.sh
```

Or manually:

```bash
cd ~/Personal/Projects/zanicchi

# Stop and remove backend container
docker-compose stop backend
docker-compose rm -f backend

# Rebuild with new code
docker-compose build backend

# Start it again
docker-compose up -d backend

# Check logs
docker-compose logs -f backend
```

## Why This Happened

You pulled the latest code with the paid_date fix, but the Docker container 
was still running the old compiled code. The backend needed to be rebuilt.

## When to Rebuild

Rebuild the backend whenever you:
- Pull new backend code from git
- Change any `.ts` file in `backend/src/`
- Update `package.json` dependencies

The frontend doesn't need rebuild (it's just static files served by nginx).

## Full Rebuild (if needed)

If something is really broken:

```bash
docker-compose down
docker-compose up -d --build
```

This rebuilds everything from scratch.
