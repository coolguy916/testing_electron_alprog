# 🚀 PHP API Gateway - Flexible, Secure, and Ready-to-Use!

Selamat datang di **PHP API Gateway**, sebuah sistem gateway berbasis PHP yang dirancang untuk menangani berbagai jenis input, mengamankan data sensitif, dan memudahkan integrasi antar perangkat—baik itu sensor IoT, aplikasi mobile, atau platform monitoring berbasis web.

## ⚙️ Setup Cepat

> Dalam hitungan menit, API ini siap jalan di servermu!

1. Letakkan semua file PHP ke direktori server web kamu.
2. Buat file `.env` di root project atau atur environment variables dengan isi seperti ini:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=db_alpro
   DB_ENCRYPTION_KEY=your_secret_encryption_key
Pastikan server kamu mendukung URL rewriting (misalnya Apache + mod_rewrite).

🌐 Endpoint API
📤 1. Kirim Data (JSON Body - POST)
http
Copy
Edit
POST /api/maui-data
Content-Type: application/json
json
Copy
Edit
{
  "tableName": "sensor_data",
  "records": [
    { "user_id": 1, "device_id": "sensor001", "temperature": 25.5, "humidity": 60.2 },
    { "user_id": 1, "device_id": "sensor002", "temperature": 26.1, "humidity": 58.7 }
  ]
}
🔗 2. Kirim Data via URL (GET)
GET /api/maui-url/sensor_data?user_id=1&device_id=sensor001&temperature=25.5&humidity=60.2
📋 3. Kirim Data via Form (POST)
POST /api/maui-url/sensor_data
Content-Type: application/x-www-form-urlencoded
ini
user_id=1&device_id=sensor001&temperature=25.5&humidity=60.2
🔄 4. Kirim Data JSON Alternatif (POST)
POST /api/maui-url/sensor_data
Content-Type: application/json
{
  "user_id": 1,
  "device_id": "sensor001",
  "temperature": 25.5,
  "humidity": 60.2
}
🔍 5. Ambil Data (GET)
GET /api/maui-get/sensor_data
GET /api/maui-get/sensor_data?filters[user_id]=1
GET /api/maui-get/sensor_data?filters[user_id]=1&orderBy[column]=created_at&orderBy[direction]=DESC
GET /api/maui-get/sensor_data?filters[device_id]=sensor001&limit=10
❤️ 6. Health Check
http
GET /api/health
📦 Format Response
✅ Sukses
json
{
  "success": true,
  "message": "Successfully inserted 1 records into 'sensor_data'.",
  "insertedIds": [123]
}
❌ Gagal
json
{
  "success": false,
  "error": "A 'tableName' string is required in the request body."
}
📤 Hasil Query
json
{
  "success": true,
  "message": "Successfully retrieved 2 records from 'sensor_data'.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "device_id": "sensor001",
      "temperature": 25.5,
      "humidity": 60.2,
      "created_at": "2025-06-17 10:30:00"
    },
    {
      "id": 2,
      "user_id": 1,
      "device_id": "sensor002",
      "temperature": 26.1,
      "humidity": 58.7,
      "created_at": "2025-06-17 10:31:00"
    }
  ],
  "count": 2
}
🌟 Fitur Unggulan
🔄 Multi Input Format: JSON, query string, atau form data? Semua bisa!

🔐 Keamanan Data: Enkripsi otomatis untuk data sensitif.

🧠 Query Fleksibel: Filter, sort, limit — semua bisa diatur via URL.

🛡️ Penanganan Error: Feedback error yang jelas dan bermanfaat.

🌍 CORS Support: Aman dan siap dipanggil dari front-end manapun.

🤝 Siapa yang Cocok Menggunakan?
Pengembang IoT yang butuh endpoint cepat & aman

Tim backend yang ingin gateway fleksibel tanpa framework berat

Siapa pun yang butuh REST API instan pakai PHP

🧠 Tips Tambahan
Gunakan tools seperti Postman untuk menguji endpoint secara interaktif.

Untuk skenario produksi, pastikan .env tidak terbuka untuk publik dan gunakan HTTPS.

📬 Kontribusi
Feel free untuk fork, buat pull request, atau laporkan issue. Kamu bisa bantu membuat API ini lebih keren!

Dibuat dengan ❤️ oleh developer yang cinta solusi ringan tapi powerful.

yaml

---

Kalau kamu ingin disisipkan logo, ilustrasi diagram, atau bahkan badge CI/Status, tinggal bilang aj
