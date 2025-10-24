# Local Network IoT Demo Setup Guide

## Overview
Run your ServSync MERN stack locally and connect ESP32 displays over your local Wi-Fi network - perfect for demonstration without needing hosting!

## Why This Approach is Excellent for Demo

✅ **No hosting costs** - everything runs locally  
✅ **Fast development** - instant changes without uploads  
✅ **Reliable connection** - no internet dependency  
✅ **Real-time testing** - see changes immediately  
✅ **Professional demo** - shows real IoT integration  

## Quick Setup Steps

### 1. Find Your Laptop's Local IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter (e.g., `192.168.1.20`)

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 2. Start Your MERN Stack

**Backend (already configured to accept network connections):**
```powershell
cd C:\Y2S2-ITP-Project\ServSync\backend
npm run dev
```

**Frontend:**
```powershell
cd C:\Y2S2-ITP-Project\ServSync\frontend  
npm run dev
```

### 3. Test Network Access

From another device on same network, visit:
- **Frontend**: `http://YOUR_LOCAL_IP:5173`
- **Backend API**: `http://YOUR_LOCAL_IP:5000/api/sessions`
- **IoT Endpoint**: `http://YOUR_LOCAL_IP:5000/api/iot/display?sessionId=test&counterId=test`

### 4. ESP32 Configuration

Update your ESP32 code with your local IP:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi credentials (same network as your laptop)
const char* WIFI_SSID = "Your_WiFi_Name";
const char* WIFI_PASS = "Your_WiFi_Password";

// Replace 192.168.1.20 with YOUR laptop's actual local IP
const char* SERVER_URL = "http://192.168.1.20:5000/api/iot/display?sessionId=SESSION_ID&counterId=COUNTER_ID";

unsigned long lastFetch = 0;
const unsigned long POLL_INTERVAL_MS = 2000; // Poll every 2 seconds

String lastCurrentToken = "";

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("Connecting to server: ");
  Serial.println(SERVER_URL);

  // TODO: Initialize your display (LCD, OLED, etc.)
  // display.begin();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  unsigned long now = millis();
  if (now - lastFetch >= POLL_INTERVAL_MS) {
    lastFetch = now;
    fetchAndDisplayData();
  }
  
  delay(100);
}

void fetchAndDisplayData() {
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(SERVER_URL);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // Parse JSON response
    StaticJsonDocument<2048> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // Extract data
      const char* slotState = doc["slot"]["state"] | "idle";
      const char* currentToken = doc["current"]["tokenNo"] | nullptr;
      const char* currentName = doc["current"]["name"] | nullptr;
      const char* nextToken = doc["next"]["tokenNo"] | nullptr;
      const char* nextName = doc["next"]["name"] | nullptr;
      long timerRemainingMs = doc["current"]["timerRemainingMs"] | -1;
      int waitingCount = doc["queue"]["waitingCount"] | 0;
      
      // Detect new token for beep/alert
      if (currentToken && strlen(currentToken) > 0) {
        String newToken = String(currentToken);
        if (newToken != lastCurrentToken && lastCurrentToken != "") {
          Serial.println("🔔 NEW TOKEN CALLED! Beep!");
          // TODO: Trigger buzzer, LED, etc.
          // digitalWrite(BUZZER_PIN, HIGH);
          // delay(500);
          // digitalWrite(BUZZER_PIN, LOW);
        }
        lastCurrentToken = newToken;
      }
      
      // Display on Serial (replace with your LCD/OLED code)
      Serial.println("╔══════════════════════════════════╗");
      Serial.println("║           QUEUE DISPLAY          ║");
      Serial.println("╠══════════════════════════════════╣");
      Serial.printf("║ Slot Status: %-19s ║\n", slotState);
      
      if (strcmp(slotState, "prestart") == 0) {
        Serial.println("║                                  ║");
        Serial.println("║    🕐 WAITING FOR SLOT START    ║");
        Serial.println("║                                  ║");
      } else {
        Serial.printf("║ Now Serving: %-19s ║\n", currentToken ? currentToken : "—");
        Serial.printf("║ Customer: %-22s ║\n", currentName ? currentName : "—");
        Serial.printf("║ Time Left: %-21s ║\n", formatMs(timerRemainingMs).c_str());
        Serial.println("║                                  ║");
        Serial.printf("║ Next: %-26s ║\n", nextToken ? nextToken : "—");
        Serial.printf("║ Next Customer: %-18s ║\n", nextName ? nextName : "—");
      }
      
      Serial.println("║                                  ║");
      Serial.printf("║ Waiting: %-23d ║\n", waitingCount);
      Serial.println("╚══════════════════════════════════╝");
      Serial.println();
      
      // TODO: Update your actual display here
      // updateLCD(currentToken, currentName, nextToken, timerRemainingMs, waitingCount);
      
    } else {
      Serial.printf("JSON parse error: %s\n", error.c_str());
    }
    
  } else if (httpCode > 0) {
    Serial.printf("HTTP error: %d\n", httpCode);
  } else {
    Serial.printf("HTTP connection failed: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

String formatMs(long ms) {
  if (ms < 0) return "—";
  long seconds = ms / 1000;
  long minutes = seconds / 60;
  seconds = seconds % 60;
  return String(minutes) + "m " + String(seconds) + "s";
}

// TODO: Implement your actual display update function
/*
void updateLCD(const char* currentToken, const char* currentName, 
               const char* nextToken, long timerMs, int waiting) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Now: ");
  lcd.print(currentToken ? currentToken : "---");
  
  lcd.setCursor(0, 1);
  lcd.print("Next: ");
  lcd.print(nextToken ? nextToken : "---");
  
  lcd.setCursor(0, 2);
  lcd.print("Wait: ");
  lcd.print(waiting);
  
  lcd.setCursor(0, 3);
  lcd.print("Time: ");
  lcd.print(formatMs(timerMs));
}
*/
```

## Demo Workflow

### 1. **Setup Demo Session**
1. Start your MERN stack locally
2. Create a session in CCO dashboard
3. Add some test appointments/tokens
4. Note the `sessionId` and `counterId` from browser URL

### 2. **Configure ESP32**
1. Replace `SESSION_ID` and `COUNTER_ID` in ESP32 code with real values
2. Update `SERVER_URL` with your laptop's IP address
3. Flash ESP32 and connect to same Wi-Fi

### 3. **Live Demo**
1. Open CCO dashboard: `http://localhost:5173/cco/dashboard?sessionId=...&counterId=...`
2. ESP32 shows current queue status
3. **Call next customer** → ESP32 updates immediately! 🎉
4. **Start serving** → ESP32 shows timer countdown
5. **Complete service** → ESP32 shows next customer

## Network Troubleshooting

### Common Issues & Solutions

**ESP32 can't connect to server:**
```cpp
// Test basic connectivity first
Serial.println("Testing server connection...");
HTTPClient http;
http.begin("http://192.168.1.20:5000/api/sessions");
int code = http.GET();
Serial.printf("Test result: %d\n", code);
```

**Windows Firewall blocking:**
```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5000
```

**Different subnets:**
- Ensure laptop and ESP32 on same Wi-Fi network
- Avoid guest networks (often isolated)
- Use main router Wi-Fi, not mobile hotspot

## Demo Enhancement Ideas

### 1. **Visual Feedback**
```cpp
// Add LEDs or buzzer for queue events
#define GREEN_LED 2   // Current serving
#define YELLOW_LED 4  // Next customer  
#define BUZZER 5      // New token alert
```

### 2. **Multiple Displays**
- Connect multiple ESP32s with different `counterId`
- Each shows its own counter's queue
- Perfect for multi-counter demo!

### 3. **Mobile-Friendly Display**
Open the HTML display page on phones/tablets:
`http://YOUR_LOCAL_IP:5173/queue-display.html?sessionId=...&counterId=...`

## Professional Demo Script

"**Today I'll show you our IoT-integrated queue management system:**

1. **Customer arrives** → Check-in at reception  
2. **Token generated** → Appears in CCO dashboard  
3. **ESP32 display updates** → Shows waiting queue  
4. **Officer calls next** → ESP32 beeps and shows current customer  
5. **Service timer** → Counts down on ESP32 display  
6. **Service complete** → ESP32 shows next customer automatically  

**All in real-time, no internet required - perfect for rural branches!**"

This local setup is actually **superior for demos** because:
- ✅ No internet dependency
- ✅ Instant response times  
- ✅ No hosting costs
- ✅ Easy to modify live
- ✅ Shows real IoT integration

Perfect choice for demonstrating your system! 🚀