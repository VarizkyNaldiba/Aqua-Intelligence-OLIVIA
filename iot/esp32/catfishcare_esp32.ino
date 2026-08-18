/**
 * CATFISHCARE - Smart Aquaculture ESP32 Firmware
 * Closed-Loop AIoT Water Quality Monitoring & Smart Water Exchange
 *
 * Paper: CatfishCare - Smart Aquaculture Berbasis IoT, Computer Vision,
 *        dan Multimodal AI untuk Budidaya Lele Presisi (Politeknik Negeri Malang 2026)
 *
 * Hardware:
 *  - ESP32 Development Board
 *  - pH Sensor (PH-4502C) on ADC Pin 34
 *  - Temperature Sensor (DS18B20) on OneWire Pin 4
 *  - Turbidity Sensor (Analog) on ADC Pin 35
 *  - TDS Sensor (Gravity Analog) on ADC Pin 32
 *  - Water Level Sensor (JSN-SR04T Ultrasonic) on Trig Pin 5, Echo Pin 18
 *  - Drain Pump Relay on Pin 23
 *  - Fill Pump Relay on Pin 22
 *  - Aerator Relay on Pin 21
 *  - Automatic Feeder Servo (MG996R) on Pin 19
 *  - Solar Power & Battery ADC on Pin 33
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>

// ==================== CONFIGURATION ====================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Laravel Server / Laragon Endpoint (Ganti dengan IP Laptop/Server Anda)
const char* SERVER_HOST = "http://192.168.1.100:8000";
const int KOLAM_ID = 9; // Kolam A (09) default

// Pin Definitions
#define PIN_PH            34
#define PIN_ONEWIRE_TEMP  4
#define PIN_TURBIDITY     35
#define PIN_TDS           32
#define PIN_TRIG_LEVEL    5
#define PIN_ECHO_LEVEL    18
#define PIN_DRAIN_PUMP    23
#define PIN_FILL_PUMP     22
#define PIN_AERATOR       21
#define PIN_SERVO_FEEDER  19
#define PIN_BATTERY_ADC   33

// Relay Logic (Active LOW or Active HIGH)
#define RELAY_ON  LOW
#define RELAY_OFF HIGH

// ==================== GLOBAL INSTANCES ====================
OneWire oneWire(PIN_ONEWIRE_TEMP);
DallasTemperature tempSensor(&oneWire);
Servo feederServo;

// Telemetry & State
float currentPh = 7.2;
float currentTemp = 27.5;
float currentTurbidity = 18.0;
float currentTds = 420.0;
float currentWaterLevel = 100.0; // cm
float initialWaterLevel = 100.0; // Level acuan kolam
float currentSfr = 0.05; // 5% default
float calculatedRiskScore = 15.0;
String riskStatus = "Low";

bool isWaterExchangeActive = false;
bool isDrainActive = false;
bool isFillActive = false;
bool isAeratorActive = false;
bool isFeederLocked = false;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 3000; // Kirim tiap 3 detik

// ==================== SENSOR READING FUNCTIONS ====================
float readTemperature() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t < 0 || t > 60) {
    return 27.5; // Fallback jika sensor terlepas
  }
  return t;
}

float readPh() {
  int raw = analogRead(PIN_PH);
  float voltage = raw * (3.3 / 4095.0);
  // Kalibrasi PH-4502C: pH = 7.0 + ((2.5 - voltage) / 0.18)
  float ph = 7.0 + ((1.65 - voltage) * 3.5);
  if (ph < 0) ph = 0;
  if (ph > 14) ph = 14;
  return ph;
}

float readTurbidity() {
  int raw = analogRead(PIN_TURBIDITY);
  float voltage = raw * (3.3 / 4095.0);
  // Kurva konversi NTU (kekeruhan tinggi = tegangan turun)
  float ntu = -1120.4 * (voltage * voltage) + 5742.3 * voltage - 4352.9;
  if (ntu < 0) ntu = 0;
  if (ntu > 300) ntu = 300;
  return ntu;
}

float readTds() {
  int raw = analogRead(PIN_TDS);
  float voltage = raw * (3.3 / 4095.0);
  float tds = (133.42 * voltage * voltage * voltage - 255.86 * voltage * voltage + 857.39 * voltage) * 0.5;
  if (tds < 0) tds = 0;
  return tds;
}

float readWaterLevel() {
  digitalWrite(PIN_TRIG_LEVEL, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG_LEVEL, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG_LEVEL, LOW);
  
  long duration = pulseIn(PIN_ECHO_LEVEL, HIGH, 30000);
  if (duration == 0) return initialWaterLevel;
  
  // Jarak ke permukaan air (cm)
  float distance = duration * 0.034 / 2;
  // Tinggi air = Total Kedalaman Kolam (120 cm) - Jarak Sensor
  float waterHeight = 120.0 - distance;
  if (waterHeight < 0) waterHeight = 0;
  return waterHeight;
}

// ==================== RISK ASSESSMENT CALCULATION ====================
// Sesuai Tabel 10 di Paper CatfishCare (Bobot 1/6 untuk setiap 6 parameter)
float computeRiskScore(float ph, float temp, float turb, float tds, float levelDev, float sfr) {
  float scorePh = 0, scoreTemp = 0, scoreTurb = 0, scoreTds = 0, scoreLevel = 0, scoreSfr = 0;

  // 1. pH
  if (ph >= 6.5 && ph <= 8.2) scorePh = 0;
  else if ((ph >= 6.0 && ph < 6.5) || (ph > 8.2 && ph <= 9.0)) scorePh = 40;
  else if ((ph >= 5.5 && ph < 6.0) || (ph > 9.0 && ph <= 9.5)) scorePh = 70;
  else scorePh = 100;

  // 2. Suhu
  if (temp >= 25.0 && temp <= 30.0) scoreTemp = 0;
  else if ((temp >= 23.0 && temp < 25.0) || (temp > 30.0 && temp <= 32.0)) scoreTemp = 40;
  else if ((temp >= 20.0 && temp < 23.0) || (temp > 32.0 && temp <= 35.0)) scoreTemp = 70;
  else scoreTemp = 100;

  // 3. Turbidity
  if (turb <= 25.0) scoreTurb = 0;
  else if (turb <= 50.0) scoreTurb = 40;
  else if (turb <= 100.0) scoreTurb = 70;
  else scoreTurb = 100;

  // 4. TDS
  if (tds <= 500.0) scoreTds = 0;
  else if (tds <= 800.0) scoreTds = 40;
  else if (tds <= 1200.0) scoreTds = 70;
  else scoreTds = 100;

  // 5. Water Level Deviation (cm)
  if (levelDev <= 5.0) scoreLevel = 0;
  else if (levelDev <= 10.0) scoreLevel = 40;
  else if (levelDev <= 20.0) scoreLevel = 70;
  else scoreLevel = 100;

  // 6. Surface Fish Ratio (SFR)
  if (sfr < 0.10) scoreSfr = 0;
  else if (sfr <= 0.20) scoreSfr = 40;
  else if (sfr <= 0.35) scoreSfr = 70;
  else scoreSfr = 100;

  // Weighted sum: 1/6 * total
  float total = (scorePh + scoreTemp + scoreTurb + scoreTds + scoreLevel + scoreSfr) / 6.0;
  return total;
}

// ==================== SMART WATER EXCHANGE EXECUTION ====================
// Sesuai Flowchart halaman 26 & 30
void executeSmartWaterExchange(String level) {
  if (isWaterExchangeActive) return; // Sedang berjalan
  
  isWaterExchangeActive = true;
  isFeederLocked = true; // 1. Tutup Automatic Feeder
  Serial.println("[AIoT] SMART WATER EXCHANGE DIMULAI!");
  Serial.println("[AIoT] Feeder dikunci untuk mencegah limbah organik bertambah.");

  float targetReductionPercent = (level == "Critical") ? 0.50 : 0.25; // 50% untuk Kritis, 25% untuk Tinggi
  float targetDrainLevel = initialWaterLevel * (1.0 - targetReductionPercent);

  // 2. Aktifkan Drain Pump (Pembuangan)
  Serial.printf("[AIoT] Menyalakan Drain Pump (Target level: %.1f cm)...\n", targetDrainLevel);
  digitalWrite(PIN_DRAIN_PUMP, RELAY_ON);
  isDrainActive = true;

  unsigned long drainStartTime = millis();
  while (readWaterLevel() > targetDrainLevel && (millis() - drainStartTime < 60000)) {
    delay(500); // Simulasi / monitoring ketinggian air berkurang
  }
  digitalWrite(PIN_DRAIN_PUMP, RELAY_OFF);
  isDrainActive = false;
  Serial.println("[AIoT] Drain Pump MATI. Target pembuangan tercapai.");

  // 3. Aktifkan Fill Pump (Pengisian Air Bersih)
  Serial.printf("[AIoT] Menyalakan Fill Pump (Kembali ke %.1f cm)...\n", initialWaterLevel);
  digitalWrite(PIN_FILL_PUMP, RELAY_ON);
  isFillActive = true;

  unsigned long fillStartTime = millis();
  while (readWaterLevel() < (initialWaterLevel - 1.0) && (millis() - fillStartTime < 60000)) {
    delay(500);
  }
  digitalWrite(PIN_FILL_PUMP, RELAY_OFF);
  isFillActive = false;
  Serial.println("[AIoT] Fill Pump MATI. Air kolam kembali ke level normal.");

  // 4. Nyalakan Aerator untuk aerasi air baru
  digitalWrite(PIN_AERATOR, RELAY_ON);
  isAeratorActive = true;
  Serial.println("[AIoT] Aerator ON untuk stabilisasi oksigen terlarut.");

  // 5. Buka kembali Feeder
  isFeederLocked = false;
  isWaterExchangeActive = false;
  Serial.println("[AIoT] Smart Water Exchange Selesai. Sistem kembali memantau secara closed-loop.");
}

// Dispense Feeding Pellet via Servo
void dispenseFeed(int grams) {
  if (isFeederLocked) {
    Serial.println("[Feeder] Pemberian pakan ditolak karena kondisi air sedang Tinggi/Kritis!");
    return;
  }
  Serial.printf("[Feeder] Mengeluarkan pakan %d gram...\n", grams);
  feederServo.write(90); // Buka corong
  delay(1500);
  feederServo.write(0);  // Tutup corong
  Serial.println("[Feeder] Selesai memberi pakan.");
}

// ==================== HTTP TELEMETRY & CONTROL SYNC ====================
void sendTelemetryToBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_HOST) + "/api/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  float levelDeviation = abs(initialWaterLevel - currentWaterLevel);
  calculatedRiskScore = computeRiskScore(currentPh, currentTemp, currentTurbidity, currentTds, levelDeviation, currentSfr);

  if (calculatedRiskScore <= 25) riskStatus = "Low";
  else if (calculatedRiskScore <= 50) riskStatus = "Medium";
  else if (calculatedRiskScore <= 75) riskStatus = "High";
  else riskStatus = "Critical";

  StaticJsonDocument<512> doc;
  doc["kolam_id"] = KOLAM_ID;
  doc["suhu"] = currentTemp;
  doc["ph"] = currentPh;
  doc["kekeruhan"] = currentTurbidity;
  doc["tds"] = currentTds;
  doc["tinggi_air"] = currentWaterLevel;
  doc["sfr"] = currentSfr;
  doc["risk_score"] = calculatedRiskScore;
  doc["risk_status"] = riskStatus;
  doc["drain_pump"] = isDrainActive;
  doc["fill_pump"] = isFillActive;
  doc["aerator"] = isAeratorActive;
  doc["feeder_locked"] = isFeederLocked;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpCode = http.POST(jsonPayload);
  if (httpCode == 200 || httpCode == 201) {
    String response = http.getString();
    StaticJsonDocument<256> respDoc;
    deserializeJson(respDoc, response);
    
    // Periksa apakah server memerintahkan aksi aktuasi
    if (respDoc.containsKey("action")) {
      String action = respDoc["action"].as<String>();
      if (action == "water_exchange") {
        executeSmartWaterExchange(riskStatus);
      } else if (action == "feed") {
        dispenseFeed(respDoc["amount"] | 100);
      } else if (action == "aerator_on") {
        digitalWrite(PIN_AERATOR, RELAY_ON);
        isAeratorActive = true;
      } else if (action == "aerator_off") {
        digitalWrite(PIN_AERATOR, RELAY_OFF);
        isAeratorActive = false;
      }
    }
  }
  http.end();

  // Autonomous trigger if Risk Score >= High
  if (!isWaterExchangeActive && (riskStatus == "High" || riskStatus == "Critical")) {
    executeSmartWaterExchange(riskStatus);
  }
}

// ==================== SETUP & LOOP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n--- CATFISHCARE AIoT ESP32 INITIALIZING ---");

  pinMode(PIN_DRAIN_PUMP, OUTPUT);
  pinMode(PIN_FILL_PUMP, OUTPUT);
  pinMode(PIN_AERATOR, OUTPUT);
  pinMode(PIN_TRIG_LEVEL, OUTPUT);
  pinMode(PIN_ECHO_LEVEL, INPUT);

  digitalWrite(PIN_DRAIN_PUMP, RELAY_OFF);
  digitalWrite(PIN_FILL_PUMP, RELAY_OFF);
  digitalWrite(PIN_AERATOR, RELAY_OFF);

  tempSensor.begin();
  feederServo.attach(PIN_SERVO_FEEDER);
  feederServo.write(0);

  // WiFi Connection
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi timeout. Running in standalone autonomous mode.");
  }
}

void loop() {
  // Read all sensors periodically
  currentTemp = readTemperature();
  currentPh = readPh();
  currentTurbidity = readTurbidity();
  currentTds = readTds();
  currentWaterLevel = readWaterLevel();

  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = millis();
    sendTelemetryToBackend();
    
    Serial.printf("[Sensors] pH: %.2f | Temp: %.1fC | Turb: %.1f NTU | TDS: %.0f ppm | Level: %.1f cm | Risk: %.1f (%s)\n",
      currentPh, currentTemp, currentTurbidity, currentTds, currentWaterLevel, calculatedRiskScore, riskStatus.c_str());
  }

  delay(100);
}
