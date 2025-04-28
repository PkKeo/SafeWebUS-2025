const THRESHOLD = 0.25;
const MIN_IMAGE_AREA = 2500;
let scanID;
let setUrlCheck = new Set();
const defaultMaskUrl = "https://www.meowbox.com/cdn/shop/articles/Screen_Shot_2024-03-15_at_10.53.41_AM.png?v=1710525250";

function scanImages(tags, setUrlCheck) {
  const webUrl = window.location.hostname;
  const visibleTop = window.scrollY;
  const visibleBottom = visibleTop + 3 * window.innerHeight;

  const images = Array.from(document.querySelectorAll('img')).filter(img => {
    const rect = img.getBoundingClientRect();
    const imgTop = rect.top + window.scrollY;
    const imgBottom = rect.bottom + window.scrollY;
    const height = rect.height;
    const width = rect.width;
    lastVisibleBottom = visibleBottom;
    lastVisibleTop = visibleTop;
    return (imgBottom >= visibleTop && imgTop <= visibleBottom) 
    && (height * width > MIN_IMAGE_AREA);
});
  //const images = document.querySelectorAll("img");

  for (const img of images) {
    const imageUrl = img.src;
    if(setUrlCheck.has(imageUrl)) continue;
    setUrlCheck.add(imageUrl);
    if (imageUrl.endsWith(".svg") || imageUrl.includes("data:image/svg+xml"))
    {
      continue; // Skip this image and move to the next one
    }
    else if(imageUrl == defaultMaskUrl)
    {
       continue;
    }
    

    chrome.runtime.sendMessage(
      {
        type: "CHECK_IMAGE",
        imageUrl: imageUrl,
        tags: tags,
        webUrl: webUrl
      },
      (response) => {
        if (Array.isArray(response)) {
          let blocked = false;
      
          for (const frameResult of response) {
            if (frameResult && frameResult.score >= THRESHOLD) {
              console.log(`Hiding image (frame ${frameResult.image_index}, score ${frameResult.score}): ${imageUrl}`);
      
              img.src = defaultMaskUrl;
              img.srcset = "";
              img.alt = "Updated Image with Mask";
      
              blocked = true;
              break; // Stop after the first high-score frame
            }
          }
          
          if (!blocked) {
            console.log(`Image OK (no frame exceeded threshold): ${imageUrl}`);
          }
      
        } else {
          console.warn(`Error or unexpected response for: ${imageUrl}`, response);
        }
      }
      
    );
  }
}


// Load tags and then scan
chrome.storage.local.get(["userTags"], (result) => {
  const tags = result.userTags || [];
  if (tags.length > 0) {
    scanID = setInterval(() => {
      scanImages(tags, setUrlCheck);
  }, 2000);
  } else {
    console.log("No tags defined by user. Skipping scan.");
  }
});


chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "TAGS_UPDATED") return;

  const newtags = Array.isArray(message.tags) ? message.tags : [];
  console.log("TAGS_UPDATED received, new tags:", newtags);

  // Stop any ongoing scan loop
  if (scanID) {
    clearInterval(scanID);
    scanID = null;
  }
  // Clear out which URLs have been seen
  setUrlCheck.clear();

  // If there are new tags, immediately scan once and then restart the interval
  if (newtags.length > 0) {
    console.log("Rescanning images with updated tags…");
    // 1) Immediate scan so you don't have to wait
    scanImages(newtags, setUrlCheck);
    // 2) Schedule periodic rescans
    scanID = setInterval(() => {
      scanImages(newtags, setUrlCheck);
    }, 2000);
  }
});
