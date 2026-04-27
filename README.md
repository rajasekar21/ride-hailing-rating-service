# Rating Service

Stores ratings for completed trips.

## API
- `POST /v1/trips/:id/rating`
- `GET /v1/ratings`
- `GET /v1/ratings/trip/:tripId`
- `GET /metrics`
- `GET /health`

## Environment Variables
- `DB_PATH` (default: `ratings.db`)
- `TRIP_SERVICE_URL` (default: `http://ride:3000`)

## Run Locally
```bash
npm install
node app.js
```

## Docker
```bash
docker build -t ride-hailing-rating-service .
docker run -p 3005:3000 ride-hailing-rating-service
```
