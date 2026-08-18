# CatfishCare AIoT Embedded & Hardware System

Dokumentasi rancangan perangkat keras, mikrokontroler, sensor, aktuator, dan kamera sesuai Paper:
**"CATFISHCARE: SMART AQUACULTURE BERBASIS IoT, COMPUTER VISION, DAN MULTIMODAL AI UNTUK BUDIDAYA LELE PRESISI"** (Politeknik Negeri Malang, 2026).

---

## 1. Arsitektur Perangkat Keras

```
               [ Solar Panel 100 WP ]
                         │
           [ Solar Charge Controller (SCC) ]
                         │
                 [ Baterai 12V DC ]
            ┌────────────┴────────────┐
            ▼                         ▼
     [ ESP32 Node ]           [ Raspberry Pi 5 ]
            │                         │
 ┌──────────┴──────────┐              │
 │ SENSOR AKUISISI     │              │
 ├─ pH (PH-4502C)      │              ▼
 ├─ Suhu (DS18B20)     │      [ Camera Module ]
 ├─ Turbidity (Analog) │              │
 ├─ TDS (Analog)       │              ▼
 ├─ Level (JSN-SR04T)  │     (YOLO11 + ByteTrack)
 └──────────┬──────────┘              │
            │                         ▼
 ┌──────────┴──────────┐     [ Surface Fish Ratio ]
 │ AKTUATOR MITIGASI   │              │
 ├─ Drain Pump Relay   │              │
 ├─ Fill Pump Relay    │              ▼
 ├─ Aerator Relay      │    ┌──────────────────┐
 ├─ Feeder Servo MG996R│    │  LARAVEL BACKEND │
 └─────────────────────┘◄───┤ (Risk Assessment)│
                            └──────────────────┘
```

---

## 2. Pinout ESP32

| Komponen / Sensor | Tipe Sensor | Pin ESP32 | Keterangan |
|-------------------|-------------|-----------|------------|
| **PH-4502C** | Analog ADC | `GPIO 34` | Sensor pH Air Kolam (Kalibrasi 0-14) |
| **DS18B20** | Digital OneWire | `GPIO 4` | Sensor Suhu Air Waterproof (Pull-up 4.7kΩ) |
| **Turbidity Sensor** | Analog ADC | `GPIO 35` | Sensor Kekeruhan Air (NTU) |
| **TDS Sensor** | Analog ADC | `GPIO 32` | Total Dissolved Solids (ppm) |
| **JSN-SR04T Trigger**| Digital Output | `GPIO 5` | Ultrasonic Water Level Transmitter |
| **JSN-SR04T Echo** | Digital Input | `GPIO 18` | Ultrasonic Water Level Receiver |
| **Drain Pump Relay** | Digital Output | `GPIO 23` | Pompa Pembuangan Air (Smart Water Exchange) |
| **Fill Pump Relay** | Digital Output | `GPIO 22` | Pompa Pengisian Air Bersih |
| **Aerator Relay** | Digital Output | `GPIO 21` | Aerasi Oksigen Kolam |
| **Feeder Servo** | PWM Output | `GPIO 19` | Servo Motor MG996R Pemberian Pakan |
| **Baterai Solar** | Analog ADC | `GPIO 33` | Monitoring Tegangan Baterai 12V |

---

## 3. Cara Menjalankan

### A. ESP32 Firmware
1. Buka file `iot/esp32/catfishcare_esp32.ino` di **Arduino IDE** atau **PlatformIO**.
2. Install library yang dibutuhkan:
   - `ArduinoJson` (v6/v7)
   - `OneWire`
   - `DallasTemperature`
   - `ESP32Servo`
3. Sesuaikan `WIFI_SSID`, `WIFI_PASS`, dan `SERVER_HOST` (IP Laravel Laragon).
4. Upload ke board ESP32.

### B. Raspberry Pi Computer Vision Server
1. Buka terminal di Raspberry Pi:
   ```bash
   cd iot/raspberry_pi
   pip install flask opencv-python numpy requests
   python catfish_cv_server.py
   ```
2. Stream kamera aktif di: `http://<IP_RASPI>:5000/video_feed`
3. API Dataset Capture: `POST http://<IP_RASPI>:5000/api/dataset/capture`
