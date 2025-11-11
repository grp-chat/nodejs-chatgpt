const socket = io();

const displayText = document.getElementById("displayText");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");

let downloadTimeout = null; // debounce timer

socket.on("updateText", (text) => {
  displayText.textContent = text;

  // Debounced auto-download
  if (downloadTimeout) clearTimeout(downloadTimeout);
  downloadTimeout = setTimeout(() => {
    autoDownloadText(text);
  }, 500); // 500ms delay
});

sendBtn.addEventListener("click", () => {
  const newText = textInput.value.trim();
  if (newText) {
    socket.emit("newText", newText);
    textInput.value = "";
  }
});

// Function to automatically download text as file
function autoDownloadText(text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  // FIXED filename
  a.download = "text.txt";

  // Append, click, and remove
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
