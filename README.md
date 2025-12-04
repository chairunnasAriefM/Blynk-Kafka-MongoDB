
---

# 🚀 **Blynk → Kafka → MongoDB Ingestion Pipeline**

![Node.js](https://img.shields.io/badge/Node.js-14%2B-green?style=flat-square)
![KafkaJS](https://img.shields.io/badge/KafkaJS-Producer%20%2F%20Consumer-orange?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Batch%20Insert-brightgreen?style=flat-square)
![Blynk](https://img.shields.io/badge/Blynk-Cloud-blue?style=flat-square)

Pipeline ringan untuk mengambil data sensor dari **Blynk Cloud**, mengirimkannya ke **Apache Kafka**, lalu menyimpannya ke **MongoDB** menggunakan **batch insert** untuk performa yang lebih baik.

---

## 📌 **Overview**

Proyek ini berisi dua service utama:

🔹 **Producer (`producer-server.js`)**
Mengambil data sensor dari Blynk Cloud (V0, V1, V2) setiap 10 detik dan mengirimnya ke Kafka.

🔹 **Consumer (`consumer-mongo.js`)**
Membaca data dari Kafka topic `sensor_data`, menampungnya ke buffer, dan melakukan batch insert ke MongoDB setiap 60 detik.

---

## 🔄 **Arsitektur Pipeline**

```
      ┌────────────┐          ┌───────────┐          ┌─────────────┐
      │            │  HTTP    │           │  Kafka   │             │
      │ BlynkCloud ├─────────►│ Producer  ├─────────►│   Kafka     │
      │            │          │ (Node.js) │          │   Broker    │
      └────────────┘          └───────────┘          └──────┬──────┘
                                                            │
                                                            ▼
                                                    ┌──────────────┐
                                                    │   Consumer   │
                                                    │   (Node.js)  │
                                                    └───────┬──────┘
                                                            │
                                                        Batch Insert
                                                            │
                                                            ▼
                                                     ┌────────────┐
                                                     │  MongoDB   │
                                                     └────────────┘
```

---

## 📁 **Struktur Folder**

```
/blynk-kafka-mongoDB
│
├── producer-server.js      # Ambil data Blynk → Kafka
├── consumer-mongo.js       # Kafka → MongoDB (batch)
├── .env                    # Token & konfigurasi
└── README.md               # Dokumentasi ini
```

---

# ⚙️ **1. Producer — `producer-server.js`**

### ✔ Fungsi:

* Fetch **V0, V1, V2** dari Blynk Cloud
* Format payload JSON:

  * temperature
  * humidity
  * air_quality
  * timestamp
* Kirim ke Kafka topic `sensor_data`

### 📡 Polling

⏱ *Setiap 10 detik*

---

# 🗄 **2. Consumer — `consumer-mongo.js`**

### ✔ Fungsi:

* Menerima message Kafka
* Menyimpan payload ke **buffer**
* Setiap 60 detik → batch insert ke MongoDB

### 🧠 Kenapa pakai batch?

* Mengurangi jumlah query database
* Lebih cepat & hemat resource
* Menghindari bottleneck dari insert satu-per-satu

---

## 🧪 **Contoh Payload**

```json
{
  "temperature": 26.7,
  "humidity": 55.3,
  "air_quality": 82,
  "timestamp": "2025-11-30T08:20:15.123Z"
}
```

---

# 🔧 **Setup & Instalasi**

### 1️⃣ Install dependencies

```
npm install
```

### 2️⃣ Buat file `.env`

```
KAFKA_BROKER=localhost:9092
BLYNK_TOKEN=your_blynk_token_here
MONGO_URL=mongodb://127.0.0.1:27017
MONGO_DB=sensor_db
```

### 3️⃣ Jalankan Producer

```
node producer-server.js
```

### 4️⃣ Jalankan Consumer

```
node consumer-mongo.js
```

---

# 📊 **Konfigurasi**

| Komponen          | Nilai              | Deskripsi                         |
| ----------------- | ------------------ | --------------------------------- |
| `BATCH_INTERVAL`  | 60000 ms           | Insert ke MongoDB setiap 60 detik |
| `VIRTUAL_PINS`    | `["v0","v1","v2"]` | Mapping pin Blynk                 |
| `TOPIC`           | `sensor_data`      | Kafka topic yang digunakan        |
| Producer interval | 10 detik           | Polling Blynk Cloud               |

---

