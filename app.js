const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "ratings.db"
});

const Rating = db.define("Rating", {
  trip_id: DataTypes.INTEGER,
  rider_id: DataTypes.INTEGER,
  driver_id: DataTypes.INTEGER,
  rating: DataTypes.INTEGER,
  feedback: DataTypes.STRING,
  created_at: DataTypes.STRING
});

db.sync();

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || "http://ride:3000";

app.use((req, res, next) => {
  const requestId = req.get("X-Request-ID") || `req-${Date.now()}`;
  req.requestId = requestId;
  console.log(JSON.stringify({ requestId, method: req.method, path: req.path, body: req.body }));
  next();
});

app.post("/v1/trips/:id/rating", async (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { rider_id, driver_id, rating, feedback } = req.body;
    if (!rider_id || !driver_id || typeof rating !== "number") {
      return res.status(400).send({ error: "rider_id, driver_id, and numeric rating are required" });
    }

    const tripResponse = await axios.get(`${TRIP_SERVICE_URL}/v1/trips/${tripId}`, {
      headers: { "X-Request-ID": req.requestId }
    });
    const trip = tripResponse.data;
    if (!trip || trip.trip_status !== "COMPLETED") {
      return res.status(400).send({ error: "Rating is allowed only for completed trips" });
    }

    const existing = await Rating.findOne({ where: { trip_id: tripId } });
    if (existing) {
      return res.status(409).send({ error: "Rating already exists for this trip" });
    }

    const saved = await Rating.create({
      trip_id: tripId,
      rider_id,
      driver_id,
      rating,
      feedback: feedback || "",
      created_at: new Date().toISOString()
    });
    res.status(201).send(saved);
  } catch (err) {
    if (err.response && err.response.data) {
      return res.status(err.response.status).send(err.response.data);
    }
    res.status(500).send({ error: "Failed to save rating", details: err.message });
  }
});

app.get("/v1/ratings", async (req, res) => {
  const ratings = await Rating.findAll();
  res.send(ratings);
});

app.get("/v1/ratings/trip/:tripId", async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const ratings = await Rating.findAll({ where: { trip_id: tripId } });
  res.send(ratings);
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/metrics", async (req, res) => {
  const ratings = await Rating.findAll({ attributes: ["rating"] });
  const total = ratings.length;
  const sum = ratings.reduce((acc, row) => acc + Number(row.rating || 0), 0);
  res.send({
    avg_driver_rating: total ? Number((sum / total).toFixed(2)) : 0,
    ratings_total: total
  });
});

app.listen(3000, () => {
  console.log("Rating service running on port 3000");
});