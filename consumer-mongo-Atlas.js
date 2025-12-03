require("dotenv").config();
const { Kafka } = require("kafkajs");
const { MongoClient, ServerApiVersion } = require("mongodb");

// Kafka
const kafka = new Kafka({
  clientId: "blynk-consumer",
  brokers: [process.env.KAFKA_BROKER]
});
const consumer = kafka.consumer({ groupId: "blynk-group" });

// MongoDB Atlas
const mongoClient = new MongoClient(process.env.MONGO_URL, {
  serverApi: ServerApiVersion.v1,
});

let collection;

async function run() {
  try {
    // Connect ke MongoDB Atlas
    await mongoClient.connect();

    console.log("MongoDB Atlas Connected!");

    const db = mongoClient.db(process.env.MONGO_DB);
    collection = db.collection("sensor_logs");

    // Kafka Consumer
    await consumer.connect();
    await consumer.subscribe({ topic: "blynk_sensor" });

    console.log("Kafka consumer listening...");

    await consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        console.log("Menerima data:", data);

        await collection.insertOne(data);
        console.log("✔ Tersimpan ke MongoDB Atlas");
      }
    });

  } catch (e) {
    console.error("ERROR:", e);
  }
}

run();
