#include <Arduino_JSON.h>
#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketClient.h>
#include <HTTPClient.h>
#include <M5Stack.h>
#include <secrets.h>
//#include <ArduinoHttpClient.h>

WebSocketClient wsClient;
WiFiClient wifiClient;
#define HOST "192.168.0.38"
#define PORT 8000
#define PATH "/"

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
    if (!wifiClient.connect(HOST, PORT)) {
      Serial.println("Connection to server failed.");
    }
    Serial.println("Connected to server.");

    wsClient.path = PATH;
    wsClient.host = HOST;

    if(!wsClient.handshake(wifiClient)) {
      Serial.println("Handshake failed.");
    }
    Serial.println("Handshake succeeded.");


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

void displayText(String text, int x, int y, int size) {
  M5.Lcd.setTextWrap(false, false);
  M5.Lcd.setCursor(x, y);
  M5.Lcd.setTextSize(size);
  M5.Lcd.print(text);
}

void loop() {
  String data;

  if(wifiClient.connected()) {
    wsClient.getData(data);

    if(data.length() > 0) {
      Serial.print("data: ");
      Serial.println(data);
    }
    data = "";

  } else {
    Serial.println("wifiClient disconnected.");

    if (!wifiClient.connect(HOST, PORT)) {
      Serial.println("Re-connection to server failed.");
    }
    Serial.println("Reconnected to server.");
  }


  delay(1000);
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
