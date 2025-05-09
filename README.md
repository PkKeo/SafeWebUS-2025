# SafeWebUS-2025

SafeWebUS-2025 is an AI-powered Chrome extension that automatically hides images on web pages based on custom tags provided by the user. The extension is designed to help users filter content and improve their browsing experience.

## Demo video
[![Demo Video](https://camo.githubusercontent.com/c9e535a04f19fbc8e9eb49a55316d0f14d667b9206a9a8d8a74308b5b563bb3f/68747470733a2f2f61646d696e2e676f6f676c6575736572636f6e74656e742e636f6d2f6c6f676f2d7363732d6b657933323231373737)](https://www.youtube.com/watch?v=MwKWz402dJg)

## Project Structure

The repository is organized into two main folders:

- **Extension**: Contains all files related to the Chrome extension itself.  
- **Server**: Contains the backend server code that processes requests and handles server-side functionality.

## How to Run the Extension
### Notice on clone path
To support running on different devices, you need to clone with the **exactly** path: **D:\SafeWebUpdate\SafeWebUS-2025**

### 1. Set Up the Backend Server

1. Open a terminal or command prompt and `cd` into the **Server** folder.  
2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
3. Activate the server:
   ```bash
   uvicorn server:app --reload

### 2. Set Up the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`.  
2. Enable **Developer mode** by toggling the switch at the top-right.  
3. Click **Load unpacked** and select the **Extension** folder from this repository.  
4. The extension will now be available in Chrome.
5. At the first time using, the extension asks you for some permissions to work correctly.
6. Click this extension from the toolbar then you can use Add/Edit/Clear and Save to provide your unwanted tags.
7. Click on History Block to visualize your abortions of block images. 

### 3. Something for you to play around :)

1. The images that match your unwanted tags will not be hidden, instead, they will be changed to another default image.
You can choose your default image by setting *defaultMaskUrl* in **content.js**
2. You can also filter the image size that you want to check at *MIN_IMAGE_AREA* in **content.js**. Currently, any image with areas higher than 2500 (50 x 50) will be checked. Note that it could lead to slower in server work for checking more images.
3. Instead of entering the tag solely, you can provide more specifically for higher accuracy (example: *bet, poker and casino* rather than simply *bet*).
