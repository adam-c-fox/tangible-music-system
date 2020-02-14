#include <Arduino_JSON.h>
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <M5Stack.h>
#include <secrets.h>

#define USE_SERIAL Serial

WiFiMulti wifiMulti;

void setup() {
    M5.begin();
    M5.Power.begin();

    USE_SERIAL.begin(115200);

    USE_SERIAL.println();
    USE_SERIAL.println();
    USE_SERIAL.println();

    for(int t = 0; t < 4; t++) {
        USE_SERIAL.printf("[BOOT] %d...\n", t);
        USE_SERIAL.flush();
        delay(1000);
    }

    wifiMulti.addAP(WIFI_SSID, WIFI_PASS);
}

String httpGET(String url) {
    HTTPClient http;
    String payload = "";

    http.begin(url);
    int httpCode = http.GET();

    USE_SERIAL.printf("[HTTP] GET\n");

    if(httpCode > 0) {
      if(httpCode == HTTP_CODE_OK) {
        payload = http.getString();
        USE_SERIAL.printf("[HTTP] payload received\n");
      }
    } else {
      USE_SERIAL.printf("[HTTP] GET failed w/ error: %s\n", http.errorToString(httpCode).c_str());
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
    if((wifiMulti.run() == WL_CONNECTED)) {
        String payload = httpGET("http://192.168.0.38:5000/playback-state");
        JSONVar obj = JSON.parse(payload); 
         
        //USE_SERIAL.println(payload);               
        //USE_SERIAL.println((const char*) obj["item"]["name"]);

        M5.Lcd.fillScreen(TFT_BLACK);
        displayText((const char*) obj["item"]["name"], 10, 10, 1);
        displayText((const char*) obj["item"]["album"]["name"], 10, 20, 1);
        displayText((const char*) obj["item"]["artists"][0]["name"], 10, 30, 1);

        String png_artwork_url = httpGET("http://192.168.0.38:5000/playback-state/image-url");
        char url[256];
        png_artwork_url.toCharArray(url, png_artwork_url.length()+1);
        M5.Lcd.drawPngUrl(url, 10, 50);
    }

    delay(5000);
}
