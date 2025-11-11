const socket = io();

const displayDiv = document.getElementById('display');
const inputText = document.getElementById('inputText');
const btnChange = document.getElementById('btnChange');
const statusDiv = document.getElementById('status');

// Helper: format arrays/objects for display
function formatData(data) {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

// Helper: enable/disable button and input
function setButtonDisabled(state) {
  btnChange.disabled = state;
  inputText.disabled = state;
}

// --- Socket Events ---

socket.on('connect', () => {
  console.log('Connected to server');
});

// Load or save completed
socket.on('currentText', (data) => {
  // Display content with fade + slide + flash
  displayDiv.classList.add('fade', 'slide-in');
  setTimeout(() => {
    displayDiv.textContent = formatData(data);
    displayDiv.classList.remove('fade', 'slide-in');
    displayDiv.classList.add('flash-success');

    setTimeout(() => {
      displayDiv.classList.remove('flash-success');
      statusDiv.textContent = 'Completed';
      statusDiv.style.color = 'green';
      // Enable button only after initial load
      setButtonDisabled(false);
    }, 500);
  }, 50);
});

// Error message
socket.on('errorMessage', (msg) => {
  statusDiv.textContent = msg;
  statusDiv.style.color = 'red';
  setButtonDisabled(false);
});

// Disable/enable button for all clients during save
socket.on('savingInProgress', (state) => {
  setButtonDisabled(state);
  statusDiv.textContent = state ? 'Processing...' : 'Completed';
  statusDiv.style.color = state ? 'black' : 'green';
});

// Button click → emit save request
btnChange.addEventListener('click', () => {
  const value = inputText.value.trim();
  if (!value) {
    statusDiv.textContent = 'Please enter some text';
    statusDiv.style.color = 'red';
    return;
  }

  let dataToSend = value;
  try {
    dataToSend = JSON.parse(value);
  } catch {
    // keep as string
  }

  socket.emit('changeText', dataToSend);
});
