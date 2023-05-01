/* Progress Bar */
const socket = io();

socket.on('progress', (progress) => {
  // Log received progress
  console.log('Received progress:', progress);

  const progressBar = document.getElementById('progress');
  progressBar.style.width = `${progress}%`;

  // Update percentage displayed inside the progress bar
  progressBar.textContent = `${progress.toFixed(0)}%`;
});

socket.on('refreshingDataStatus', (isRefreshing) => {
  console.log('Received data refresh status:', isRefreshing);
  setRefreshingDataState(isRefreshing);
});

const progressBar = document.getElementById('progress');

const refreshData = async () => {
  setRefreshingDataState(true);

  try {
    const response = await fetch('/api/voting-power');
    const data = await response.json();

    const tableBody = document.getElementById('voting-power-table').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const row = tableBody.insertRow();
      row.insertCell().textContent = item.address;
      row.insertCell().textContent = item.votingPower;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  progressBar.style.display = 'none';
  setRefreshingDataState(false); // Add this line

  // Update the last updated time/date
  const lastUpdated = document.getElementById('last-updated');
  lastUpdated.textContent = `Last Updated: ${new Date().toLocaleString()}`; // Add this line
};

function setRefreshingDataState(isRefreshing) {
  const refreshDataButton = document.getElementById('refresh-data-button');
  const progressHelperText = document.getElementById('progress-helper-text');

  if (isRefreshing) {
    refreshDataButton.setAttribute('disabled', 'disabled');
    progressHelperText.style.display = 'block';
    progressBar.style.display = 'block'; // Add this line
  } else {
    refreshDataButton.removeAttribute('disabled');
    progressHelperText.style.display = 'none';
    progressBar.style.display = 'none'; // Add this line
  }
}

document.addEventListener('DOMContentLoaded', async () => { // Add 'async' keyword
  const refreshDataButton = document.getElementById('refresh-data-button');
  if (refreshDataButton) {
    refreshDataButton.addEventListener('click', refreshData);
  }

  // Add the following lines
  const isRefreshing = await getRefreshStatus();
  setRefreshingDataState(isRefreshing);
});

async function getRefreshStatus() {
  const response = await fetch('/api/voting-power/refresh-status');
  const { isRefreshing } = await response.json();
  return isRefreshing;
}

function sortTable(n, tableId) {
  const table = document.getElementById(tableId);
  let switching = true;
  let switchcount = 0;
  let shouldSwitch;
  let i;
  let x;
  let y;
  let dir = "desc";

  while (switching) {
    switching = false;
    const rows = table.rows;
    for (i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      } else if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount++;
    } else {
      if (switchcount == 0 && dir == "desc") {
        dir = "asc";
        switching = true;
      }
    }
  }
}
