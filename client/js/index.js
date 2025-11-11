(() => {
  const socket = io();

  const display = document.getElementById('display');
  const input = document.getElementById('textInput');
  const button = document.getElementById('updateBtn');

  // Smooth text change animation
  function setDisplayText(text) {
    display.animate([{ opacity: 1 }, { opacity: 0.2 }], { duration: 150, fill: 'forwards' })
      .onfinish = () => {
        display.textContent = text;
        display.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
      };
  }

  socket.on('currentText', (text) => {
    const finalText = text?.trim() || 'abc123';
    setDisplayText(finalText);
  });

  button.addEventListener('click', () => {
    const newText = input.value;
    socket.emit('updateText', newText);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') button.click();
  });
})();
