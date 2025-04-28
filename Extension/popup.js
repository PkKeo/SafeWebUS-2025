let draftTags = [];
let currentTags = [];

// Load tags on startup
chrome.storage.local.get(["userTags"], (result) => {
  currentTags = result.userTags || [];
  draftTags = [...currentTags];
  renderTags();
});

document.getElementById("addTag").addEventListener("click", () => {
  draftTags.push("");
  renderTags();
});

document.getElementById("saveTags").addEventListener("click", () => {
  // Collect non-empty tag values
  const tags = Array.from(document.querySelectorAll(".tag-item input"))
    .map(input => input.value.trim())
    .filter(v => v);

  // Persist to storage
  chrome.storage.local.set({ userTags: tags }, () => {
    // Update your local state
    currentTags = [...tags];
    draftTags   = [...tags];

    // UI feedback
    const statusEl = document.getElementById("status");
    statusEl.textContent = "Tags saved!";
    renderTags();
    setTimeout(() => statusEl.textContent = "", 2000);

    // Notify the *page* tab (not the popup) and pass tags directly
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (!tabs.length) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "TAGS_UPDATED",
        tags
      });
    });
  });
});


document.getElementById("viewHistory").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
});


function renderTags() {
  const tagList = document.getElementById("tagList");
  tagList.innerHTML = "";

  draftTags.forEach((tag, i) => {
    const li = document.createElement("li");
    li.className = "tag-item";

    const input = document.createElement("input");
    input.type  = "text";
    input.value = tag;
    input.addEventListener("input", e => {
      draftTags[i] = e.target.value;
    });

    const editBtn = document.createElement("span");
    editBtn.className = "icon";
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", () => input.focus());

    const removeBtn = document.createElement("span");
    removeBtn.className = "icon";
    removeBtn.textContent = "−";
    removeBtn.addEventListener("click", () => {
      draftTags.splice(i, 1);
      renderTags();
    });

    li.append(input, editBtn, removeBtn);
    tagList.appendChild(li);
  });
}
