# SafeWebUS-2025

SafeWebUS-2025 is an AI-powered Chrome extension that automatically hides images on web pages based on custom tags provided by the user. The extension is designed to help users filter content and improve their browsing experience.

## Project Structure

The repository is organized into two main folders:

- **Extension**: Contains all files related to the Chrome extension itself.  
- **Server**: Contains the backend server code that processes requests and handles server-side functionality.

## How to Run the Extension

### 1. Set Up the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`.  
2. Enable **Developer mode** by toggling the switch at the top-right.  
3. Click **Load unpacked** and select the **Extension** folder from this repository.  
4. The extension will now be available in Chrome.

### 2. Set Up the Backend Server

1. Open a terminal or command prompt and `cd` into the **Server** folder.  
2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
3. Activate the server:
   ```bash
   uvicorn server:app --reload
