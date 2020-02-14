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

    for(uint8_t t = 4; t > 0; t--) {
        USE_SERIAL.printf("[SETUP] WAIT %d...\n", t);
        USE_SERIAL.flush();
        delay(1000);
    }

    wifiMulti.addAP(WIFI_SSID, WIFI_PASS);
}

void loop() {
    // wait for WiFi connection
    if((wifiMulti.run() == WL_CONNECTED)) {

        HTTPClient http;

        USE_SERIAL.print("[HTTP] begin...\n");     
        http.begin("http://192.168.0.38:5000/playback-state"); //HTTP

        USE_SERIAL.print("[HTTP] GET...\n");
        // start connection and send HTTP header
        int httpCode = http.GET();

        // httpCode will be negative on error
        if(httpCode > 0) {
            // HTTP header has been send and Server response header has been handled
            USE_SERIAL.printf("[HTTP] GET... code: %d\n", httpCode);

            // file found at server
            if(httpCode == HTTP_CODE_OK) {
                String payload = http.getString();

                //JSON PARSE
                JSONVar obj = JSON.parse(payload); 
                 
                USE_SERIAL.println(payload);               
                USE_SERIAL.print("item : ");               
                USE_SERIAL.println((const char*) obj["item"]["name"]);

                M5.Lcd.fillScreen(TFT_BLACK);
                M5.Lcd.print((const char*) obj["item"]["name"]);
                //M5.Lcd.drawPngUrl((const char*) obj["item"]["album"]["images"][0]["url"], 100, 100);
                //M5.Lcd.drawPngUrl("https://upload.wikimedia.org/wikipedia/commons/d/d9/Test.png", 0, 0);
            }
        } else {
            USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
        }

        http.end();
    }

    delay(5000);
}
