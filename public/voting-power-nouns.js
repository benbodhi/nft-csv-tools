/* Progress Bar */
const socket = io();
let loaderTextInterval;

socket.on('progress', (progress) => {
  // Log received progress
  console.log('Received progress:', progress);

  const progressBar = document.getElementById('progress');
  progressBar.style.width = `${progress}%`;

  // Update percentage displayed below the progress bar
  const progressPercentage = document.getElementById('progress-percentage');
  progressPercentage.textContent = `${progress.toFixed(0)}%`;
});

socket.on('refreshingDataStatus', (isRefreshing) => {
  console.log('Received data refresh status:', isRefreshing);
  setRefreshingDataState(isRefreshing);
});

socket.on('dataRefreshed', function() {
  location.reload();
});

const progressBar = document.getElementById('progress');

const loaderTextOptions = [
  'Grabbing the goods',
  'Won\'t be too long',
  'Hang tight',
  'Getting There',
  'Time to count the hairs on your arm',
  '⌐◨-◨',
  'LFG',
  '⌐🄶-🄼',
  'gm',
  'Patience is the key',
];

function updateLoaderText(element) {
  const randomIndex = Math.floor(Math.random() * loaderTextOptions.length);
  element.textContent = loaderTextOptions[randomIndex];
}

async function fetchData() {
  const response = await fetch('/api/voting-power-data');
  const { data, lastRun } = await response.json();

  // Add logs to check the received data and lastRun values
  // console.log('Received data:', data);
  // console.log('Received lastRun:', lastRun);

  // Update the table with the data
  refreshTableData(data);

  // Wait for the DOM to update
  setTimeout(() => {
    // Sort the table by voting power descending
    sortTable(1, 'voting-power-table');
  }, 0);

  // Update the last updated text with the last run timestamp
  updateLastUpdatedText(lastRun);
}

function updateLastUpdatedText(timestamp) {
  const lastUpdatedElement = document.querySelector('#last-updated');
  if (timestamp) {
    lastUpdatedElement.textContent = `Table Last Updated: ${new Date(timestamp).toLocaleString()}`;
  } else {
    lastUpdatedElement.textContent = 'Table Last Updated: Unknown';
  }
}

async function refreshData() {
  setRefreshingDataState(true);

  try {
    const randomTextElement = document.getElementById('random-text');
    updateLoaderText(randomTextElement);
    randomTextElement.style.display = 'block';

    await fetch('/api/voting-power/refresh', {
      method: 'POST',
    });

    await fetchData();

    randomTextElement.style.display = 'none';
  } catch (error) {
    console.error('Error refreshing data:', error);
  }

  setRefreshingDataState(false);
}

function refreshTableData(data) {
  const tableBody = document.getElementById('voting-power-table-body');
  tableBody.innerHTML = '';

  data.forEach(({ address, votingPower }) => {
    const row = document.createElement('tr');
    const addressCell = document.createElement('td');
    const votingPowerCell = document.createElement('td');

    addressCell.textContent = address;
    votingPowerCell.textContent = votingPower;

    row.appendChild(addressCell);
    row.appendChild(votingPowerCell);
    tableBody.appendChild(row);
  });
}

function startLoaderTextCycle() {
  const randomTextElement = document.getElementById('random-text');
  updateLoaderText(randomTextElement);
  loaderTextInterval = setInterval(() => {
    updateLoaderText(randomTextElement);
  }, 3000);
}

function stopLoaderTextCycle() {
  clearInterval(loaderTextInterval);
}

function updateLoaderTextVisibility(isRefreshing) {
  const randomTextElement = document.getElementById('random-text');
  if (isRefreshing) {
    randomTextElement.style.display = 'block';
  } else {
    randomTextElement.style.display = 'none';
  }
}

function setRefreshingDataState(isRefreshing) {
  const refreshDataButton = document.getElementById('refresh-data-button');
  const progressHelperText = document.getElementById('progress-helper-text');
  const progressBar = document.getElementById('progress-bar');
  const randomTextElement = document.getElementById('random-text');

  if (isRefreshing) {
    refreshDataButton.setAttribute('disabled', 'disabled');
    progressHelperText.style.display = 'block';
    progressBar.style.display = 'block';
    updateLoaderText(randomTextElement);
    randomTextElement.style.display = 'block';
    startLoaderTextCycle(); // Add this line
  } else {
    refreshDataButton.removeAttribute('disabled');
    progressHelperText.style.display = 'none';
    progressBar.style.display = 'none';
    randomTextElement.style.display = 'none';
    stopLoaderTextCycle(); // Add this line
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const refreshDataButton = document.getElementById('refresh-data-button');
  if (refreshDataButton) {
    refreshDataButton.addEventListener('click', refreshData);
  }

  fetchData();

  const isRefreshing = await getRefreshStatus();
  setRefreshingDataState(isRefreshing);
  updateLoaderTextVisibility(isRefreshing);

  document.getElementById('header-address').addEventListener('click', () => sortTable(0, 'voting-power-table'));
  document.getElementById('header-voting-power').addEventListener('click', () => sortTable(1, 'voting-power-table'));
});

async function getRefreshStatus() {
  const response = await fetch('/api/voting-power/refresh-status');
  const { isRefreshing } = await response.json();
  return isRefreshing;
}

// Store the sorting state
const sortingState = {
  columnIndex: 1,
  direction: 'desc',
};

function sortTable(columnIndex, tableId) {
  const table = document.getElementById(tableId);
  const isNumeric = columnIndex === 1; // Voting power is numeric
  const prevColumnIndex = sortingState.columnIndex;

  if (prevColumnIndex === columnIndex) {
    // Reverse the sorting direction if the column is the same as the previously sorted one
    sortingState.direction = sortingState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    // Set the direction to descending if the column has changed
    sortingState.direction = 'desc';
  }

  sortingState.columnIndex = columnIndex;

  const compareFunction = isNumeric
    ? (a, b) => parseFloat(b) - parseFloat(a)
    : (a, b) => a.localeCompare(b);

  const tableRows = Array.from(table.rows).slice(1); // Exclude the header row
  const sortedRows = tableRows.sort((rowA, rowB) => {
    const cellA = rowA.cells[columnIndex].textContent.trim();
    const cellB = rowB.cells[columnIndex].textContent.trim();

    return compareFunction(cellA, cellB);
  });

  if (sortingState.direction === 'desc') {
    sortedRows.reverse();
  }

  const tableBody = table.querySelector('tbody');
  tableBody.innerHTML = '';
  sortedRows.forEach(row => tableBody.appendChild(row));
}

document.getElementById('download-csv-button').addEventListener('click', async () => {
  const response = await fetch('/api/voting-power-data');
  const { data, lastRun } = await response.json();

  console.log('Data used for CSV:', data);

  // Convert the data to CSV format
  const csvData = data.map(({ address, votingPower }) => `${address},${votingPower}`).join('\n');
  const csv = `Address,Voting Power\n${csvData}`;

  // Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'nouns-voting-power.csv';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
