const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "ratings.db"
});

const Rating = db.define("Rating", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  trip_id: DataTypes.INTEGER,
  rider_id: DataTypes.INTEGER,
  driver_id: DataTypes.INTEGER,
  rating: DataTypes.INTEGER,
  feedback: DataTypes.STRING,
  created_at: DataTypes.STRING
});

async function seed() {
  await db.sync({ force: true });

  const results = [];
  const filePath = process.env.DATASET_FILE || path.join(__dirname, "ratings.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push({
        id: parseInt(data.rating_id, 10),
        trip_id: parseInt(data.trip_id, 10),
        rider_id: parseInt(data.rider_id, 10),
        driver_id: parseInt(data.driver_id, 10),
        rating: parseInt(data.rating, 10),
        feedback: data.feedback,
        created_at: data.created_at
      });
    })
    .on("end", async () => {
      await Rating.bulkCreate(results, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${results.length} ratings`);
      await db.close();
    });
}

seed();
