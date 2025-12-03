require("dotenv").config();
const axios = require("axios");
const { Kafka } = require("kafkajs");

// Kafka
const kafka = new Kafka({
  clientId: "blynk-producer",
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

const VIRTUAL_PINS = ["v0", "v1", "v2"]; // V0: temperature, V1: humidity, V2: air_quality
const TOPIC = "sensor_data"; // pastikan sama dengan consumer

// Fungsi kirim ke Kafka
async function sendToKafka(message) {
  await producer.send({
    topic: TOPIC,
    messages: [{ value: JSON.stringify(message) }],
  });
}

// Fungsi ambil semua V-pin dari Blynk
async function fetchBlynkData() {
  try {
    const requests = VIRTUAL_PINS.map((pin) =>
      axios.get(`https://blynk.cloud/external/api/get?token=${process.env.BLYNK_TOKEN}&${pin}`)
    );

    const results = await Promise.all(requests);

    const payload = {
      temperature: parseFloat(results[0].data),
      humidity: parseFloat(results[1].data),
      air_quality: parseFloat(results[2].data),
      timestamp: new Date().toISOString(),
    };

    console.log("Sending to Kafka:", payload);
    await sendToKafka(payload);
  } catch (err) {
    console.error("Error fetching Blynk data:", err.message);
  }
}

// Main
(async () => {
  await producer.connect();
  console.log("Kafka producer connected!");

  // Polling tiap 10 detik
  setInterval(fetchBlynkData, 10000);
})();
