#include <Arduino_JSON.h>
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <M5Stack.h>
#include <secrets.h>
//#include <ArduinoHttpClient.h>
#include <ArduinoWebsockets.h>

WiFiClient wifiClient;
#define HOST "ws://192.168.0.38:8000/clients"

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

    wsClient.send("HELLO SERVER!!!");
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

void loop() {
  wsClient.poll();
}

//void loop() {
//    if((wifiMulti.run() == WL_CONNECTED)) {
//        String payload = httpGET("http://192.168.0.38:5000/playback-state");
//        JSONVar obj = JSON.parse(payload); 
//         
//        //USE_SERIAL.println(payload);               
//        //USE_SERIAL.println((const char*) obj["item"]["name"]);
//
//        M5.Lcd.fillScreen(TFT_BLACK);
//        displayText((const char*) obj["item"]["name"], 10, 10, 1);
//        displayText((const char*) obj["item"]["album"]["name"], 10, 20, 1);
//        displayText((const char*) obj["item"]["artists"][0]["name"], 10, 30, 1);
//
//        String png_artwork_url = httpGET("http://192.168.0.38:5000/playback-state/image-url");
//        char url[256];
//        png_artwork_url.toCharArray(url, png_artwork_url.length()+1);
//        M5.Lcd.drawPngUrl(url, 10, 50);
//    }
//
//    delay(5000);
//}
