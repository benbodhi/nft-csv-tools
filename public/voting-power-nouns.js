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

async function fetchData() {
  const response = await fetch('/api/voting-power-data');
  const { data, lastRun } = await response.json();

  // Update the table with the data
  refreshTableData(data);

  // Update the last updated text with the last run timestamp
  updateLastUpdatedText(lastRun);
}

function updateLastUpdatedText(timestamp) {
  const lastUpdatedElement = document.querySelector('#last-updated');
  if (timestamp) {
    lastUpdatedElement.textContent = `Last updated: ${new Date(timestamp).toLocaleString()}`;
  } else {
    lastUpdatedElement.textContent = 'Last updated: Unknown';
  }
}

async function refreshData() {
  setRefreshingDataState(true);

  try {
    await fetch('/api/voting-power/refresh', {
      method: 'POST',
    });

    await fetchData();

  } catch (error) {
    console.error('Error refreshing data:', error);
  }

  setRefreshingDataState(false);
}

function setRefreshingDataState(isRefreshing) {
  const refreshDataButton = document.getElementById('refresh-data-button');
  const progressHelperText = document.getElementById('progress-helper-text');

  if (isRefreshing) {
    refreshDataButton.setAttribute('disabled', 'disabled');
    progressHelperText.style.display = 'block';
    progressBar.style.display = 'block';
  } else {
    refreshDataButton.removeAttribute('disabled');
    progressHelperText.style.display = 'none';
    progressBar.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const refreshDataButton = document.getElementById('refresh-data-button');
  if (refreshDataButton) {
    refreshDataButton.addEventListener('click', refreshData);
  }

  fetchData();
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
