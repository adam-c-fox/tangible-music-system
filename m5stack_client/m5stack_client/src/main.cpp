#include <Arduino_JSON.h>
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <M5Stack.h>
#include <secrets.h>
#include <ArduinoWebsockets.h>
#include "utility/MPU6886.h"

#define HOST "ws://192.168.0.14:8000"

// Accelerometer
float accX = 0;
float accY = 0;
float accZ = 0;
float threshold = 0.1;
float stationaryX = 0;
float stationaryY = 0;
float stationaryZ = 1;
int previousStationaryState = 3;
bool previousState = true;
int buffer [5];
MPU6886 mpu;

// Websockets
WiFiClient wifiClient;
using namespace websockets;
WebsocketsClient wsClient;

void displayText(String text, int x, int y, int size) {
  M5.Lcd.setTextWrap(false, false);
  M5.Lcd.setCursor(x, y);
  M5.Lcd.setTextSize(size);
  M5.Lcd.print(text);
}

void onMessage(WebsocketsMessage message) {
  Serial.print("Message: ");
  Serial.println(message.data());

  JSONVar obj = JSON.parse(message.data()); 
  String messageType = (const char *) obj["command"];

  if(messageType == "pngUrl") {
    M5.Lcd.drawPngUrl((const char *) obj["url"], (int) obj["x"], (int) obj["y"]);
    wsClient.poll();
  } else if (messageType == "text") {
    displayText((const char *) obj["text"], (int) obj["x"], (int) obj["y"], 2);
  }
}

void onEvent(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connnection Opened");
    } else if(event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connnection Closed");
    } else if(event == WebsocketsEvent::GotPing) {
        Serial.println("Got a Ping!");
    } else if(event == WebsocketsEvent::GotPong) {
        Serial.println("Got a Pong!");
    }
}

void setup() {
    M5.begin();
    M5.Power.begin();
    Serial.begin(115200);
    delay(1000);

    Serial.print("\nConnecting: ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    while(WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print('.');
    }

    Serial.println();
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    // WebSocket server connection
    wsClient.onMessage(onMessage);
    wsClient.onEvent(onEvent);
    wsClient.connect(HOST);
    wsClient.ping();

    Serial.print("[wsClient] Connected to: ");
    Serial.println(HOST);
    wsClient.send("hello");

    // MPU6886
    mpu.Init();
}

String httpGET(String url) {
    HTTPClient http;
    String payload = "";

    http.begin(url);
    int httpCode = http.GET();

    Serial.printf("[HTTP] GET\n");

    if(httpCode > 0) {
      if(httpCode == HTTP_CODE_OK) {
        payload = http.getString();
        Serial.printf("[HTTP] payload received\n");
      }
    } else {
      Serial.printf("[HTTP] GET failed w/ error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
    return payload;
}

bool isStationary() {
  mpu.getAccelData(&accX, &accY, &accZ);
  float value = (accX-stationaryX) + (accY-stationaryY) + (accZ-stationaryZ);

  // Populate buffer
  for (int i=4; i>0; i--) {
    buffer[i] = buffer[i-1];
  }
  buffer[0] = value > threshold;

  // Poll buffer  
  int count = 0;
  for (int i=0; i<5; i++) {
    count += buffer[i];
  }

  if (count > previousStationaryState) {
    return false;
  } else {
    return true;
  }
}

void loop() {
  wsClient.poll();

  bool stationary = isStationary();
  if (stationary != previousStationaryState) {
    stationary ?
      M5.lcd.fillRect(315, 0, 5, 5, BLACK) :
      M5.lcd.fillRect(315, 0, 5, 5, WHITE);

    previousStationaryState = stationary;
  }

  //TODO: send stationary state to server

  delay(100);
}