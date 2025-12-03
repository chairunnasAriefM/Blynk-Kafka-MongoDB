require("dotenv").config();
const { Kafka } = require("kafkajs");
const { MongoClient } = require("mongodb");

// Kafka
const kafka = new Kafka({
  clientId: "blynk-consumer",
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "blynk-group" });

// MongoDB
const mongoClient = new MongoClient(process.env.MONGO_URL);
let collection;

// BUFFER untuk batch insert
let batchBuffer = [];
const BATCH_INTERVAL = 60000; // 60 detik

async function run() {
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGO_DB);
  collection = db.collection("sensor_logs");

  console.log("MongoDB Connected!");

  await consumer.connect();
  await consumer.subscribe({ topic: "sensor_data", fromBeginning: false });

  console.log("Kafka consumer listening...");

  // ===================
  //  🔥 TIMER BATCH INSERT
  // ===================
  setInterval(async () => {
    if (batchBuffer.length > 0) {
      const toInsert = [...batchBuffer];
      batchBuffer = []; // kosongkan buffer

      await collection.insertMany(toInsert);
      console.log(`✔ Batch insert ${toInsert.length} data ke MongoDB`);
    }
  }, BATCH_INTERVAL);

  // ===================
  //  🔥 KAFKA MESSAGE HANDLER
  // ===================
  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log("Menerima:", data);

      // Masukkan ke buffer
      batchBuffer.push(data);
    },
  });
}

run().catch(console.error);
