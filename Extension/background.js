chrome.runtime.onInstalled.addListener(() => {
  // Check if the user is already authenticated
  checkUserAuthentication();
});

// Function to handle authentication
function authenticateUser() {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
          console.error("Authentication failed", chrome.runtime.lastError);
          return;
      }
      
      // Fetch user info using the token
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
              'Authorization': 'Bearer ' + token
          }
      })
      .then(response => response.json())
      .then(data => {
          // Save user info in local storage
          let user = {
              gmail: data.email,
              id: data.sub
          };
          chrome.storage.local.set({ user: user }, () => {
              console.log("User information saved:", user);
          });
          //Send request to Server for update database
          fetch("http://127.0.0.1:8000/add_user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(user), // Send user information
          })
            .then((res) => res.json())
            .then((newdata) => {
              console.log("Server response:", newdata, "for add user:", newdata.gmail);
              //sendResponse(newdata);
            })
            .catch((err) => {
              console.error("Error contacting server:", err);
              //sendResponse({ similarity: 0 });
            });
      })
      .catch(error => console.error("Error fetching user info:", error));
  });
}

// Function to check if user is already authenticated
function checkUserAuthentication() {
  chrome.storage.local.get('user', (result) => {
      if (result.user) {
          console.log("User already authenticated:", result.user);
      } else {
          // If no user info found, authenticate the user
          authenticateUser();
      }
  });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_IMAGE") {
    const imageUrl = message.imageUrl;
    const tags = message.tags || [];  // Get the tags from the message, or default to an empty array
    const webUrl = message.webUrl;
    let id = "";

    console.log("Checking image:", imageUrl, "with tags:", tags, "from website:", webUrl);

    // Get user data from local storage
    chrome.storage.local.get("user", (result) => {
      if (result && result.user) {
        id = result.user.id;
        //console.log("User ID found:", id); 

        // Send request to server
        fetch("http://127.0.0.1:8000/check_image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
            tags: tags,
            web_url: webUrl,
            id: id
          }),
        })
        .then((res) => res.json())
        .then((data) => {
          console.log("Server response:", data, "at image URL:", imageUrl);
          sendResponse(data);  // Send the server response back to the popup
        })
        .catch((err) => {
          console.error("Error contacting server:", err);
          sendResponse({ similarity: 0 });  // Fallback response in case of error
        });

        // Keep the message channel open for async response
        return true;
      } else {
        // Handle case where user data is missing
        console.error("User data not found in local storage");
        sendResponse({ error: "User data not found" });
        return true;
      }
    });
    return true;
  }
});

