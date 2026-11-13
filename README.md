# Studyglow Sense Dashboard

this is the prompt give me the UI for this: Build a complete Raspberry Pi 5 StudySense web app using Streamlit and Python. The app has exactly three pages: Dashboard, Alerts & Preferences, and AI Assistant. Read existing TinyDB data at /home/shreyak/NOTE/studysense_db.json, using device_id, timestamp, temperature_c, humidity_pct, pressure_hpa, light_lux, presence_detected, face_detected, recognized_user, noise_dbfs, sensor_health, cloud_synced, and local_mqtt_published. Dashboard: display latest sensor readings with timestamps, historical line charts, health/connection status, and one compact status for Edge Impulse Quiet/Noisy output when available. Never invent sensor readings; label unavailable sensors. Alerts: let user configure min/max preferred temperature, minimum lux, noise tolerance, and occupancy notifications; save preferences to a local JSON file; evaluate real readings against thresholds; display and log alerts, including recommendations to move to brighter, cooler, warmer, or quieter surroundings. Treat mmWave presence as presence only, never as people counting or a confirmed free spot. Noise is dBFS, not calibrated dB SPL. AI Assistant: implement a chat UI adapter to an existing LangGraph agent at ~/NOTE/studysense_agent.py; handle unavailable agent gracefully. All alert actions must be explicitly allow-listed. No RAG, no vector database, no separate prediction dashboard, no unnecessary pages. Build modular Python files with clear requirements.txt and run instructions. Prefer real data, and if creating demo data, isolate and visibly label Demo Mode. The Streamlit UI should read records, not trigger camera/microphone acquisition on each page refresh. Do not expose face images, AWS private keys, or personal data to public users. Note that cloud_synced only indicates acknowledged AWS IoT publish, not independently verified DynamoDB delivery.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/641c888b-b7a4-58d3-a7ce-c45e6bc2a463).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
