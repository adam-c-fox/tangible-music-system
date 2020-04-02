// esp8266 nfc reader w/ http responses
// *Based on the Adafruit_PN532 library & iso14443a_uid example

#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>
#include "ESP8266WiFi.h"
#include "secrets.h"
#include "RestClient.h"

#define PN532_IRQ   (2)
#define PN532_RESET (0)

Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);
RestClient client = RestClient("192.168.1.33", 8002);

void setup() {
  Serial.begin(115200);

  // WiFi/HTTP Setup
  client.begin(wifi_ssid, wifi_pass);
 
  // NFC Setup
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (! versiondata) {
    Serial.print("Didn't find PN53x board");
    while (1); // halt
  }
  
  Serial.print("Found chip PN5"); Serial.println((versiondata>>24) & 0xFF, HEX); 
  Serial.print("Firmware ver. "); Serial.print((versiondata>>16) & 0xFF, DEC); 
  Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);
  
  // Set the max number of retry attempts to read from a card
  nfc.setPassiveActivationRetries(0xFF);
  
  // configure board to read RFID tags
  nfc.SAMConfig();

  Serial.println("Waiting for an NFC tag...");
}

void loop() {
  boolean success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
  
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, &uid[0], &uidLength);
  
  if (success) {
    Serial.println("Found a tag!");
    Serial.print("UID Length: ");Serial.print(uidLength, DEC);Serial.println(" bytes");
    Serial.print("UID Value: ");

    for (uint8_t i=0; i < uidLength; i++) 
    {
      Serial.print(" 0x");Serial.print(uid[i], HEX); 
    }
    Serial.println("");

    String response = "";
    char concatenation[100];
    sprintf(concatenation, "/nfc/send-tag?tag=%u", uid[1]);
    int statusCode = client.post(concatenation, "", &response);
    
    // Wait 1 second before continuing
    delay(1000);
  } else {
    // PN532 probably timed out waiting for a card
    Serial.println("Timed out waiting for a card");
  }
}
