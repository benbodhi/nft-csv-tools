const toggleSwitch = document.querySelector('.toggle__input');

function switchTheme(event) {
  const toggleLabel = document.querySelector('.toggle__label');
  if (event.target.checked) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    // toggleLabel.querySelector('.toggle__icon--light').style.display = 'inline-block';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    // toggleLabel.querySelector('.toggle__icon--dark').style.display = 'inline-block';
  }
}

toggleSwitch.addEventListener('change', switchTheme, false);

document.getElementById('toggle').addEventListener('change', function () {
  if (this.checked) {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    localStorage.setItem('mode', 'light');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    localStorage.setItem('mode', 'dark');
  }
});

(function () {
  const storedMode = localStorage.getItem('mode');
  if (storedMode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    toggleSwitch.checked = true;
    switchTheme({ target: toggleSwitch });
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    toggleSwitch.checked = false;
  }
})();

function applyStoredMode() {
  const storedMode = localStorage.getItem('mode');
  if (storedMode === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    toggleSwitch.checked = true;
  } else {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    toggleSwitch.checked = false;
  }
}

document.addEventListener('DOMContentLoaded', applyStoredMode);
