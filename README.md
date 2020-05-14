# tangible-music-system

The backend for the Tangible Music System, created as part of my Final Year Project as an Undergraduate Computer Scientist @ University of Bristol (MEng).

## Project Overview
![](https://i.imgur.com/2y4VTXR.png)

## Installation Instructions

### Backend
1. Clone the repository
2. `cd tangible-music-system`
3. `docker-compose up`

### M5Stack
1. Recommended: VSCode with PlatformIO
2. Set `HOST` as the address of the backend services
3. Create a `secrets.h` with the following:
  ```
  #define WIFI_SSID "your_wifi_ssid"
  #define WIFI_PASS "your_wifi_password"
  ```
3. Recompile and Upload to the M5Stack

### Alexa Skill
1. Create a new skill inside the Alexa Developer Console
2. Upload the files inside `tangible-music-system/alexa_skill` to your new skill
3. Configure as desired

### ESP8266 NFC Reader
1. As above, using the same `secrets.h` file

## Demo Video

[![Watch the video](https://img.youtube.com/vi/0rt0C0S6nHM/maxresdefault.jpg)](https://youtu.be/0rt0C0S6nHM)
