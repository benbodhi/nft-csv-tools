// Establish a connection to the server using the Socket.IO library
const socket = io();

// Initialize the loader text interval variable
let loaderTextInterval;

// Set up a socket event listener for 'progress' events
socket.on('progress', (progress) => {
  // Log the progress received from the server
  console.log('Received progress:', progress);

  // Get a reference to the progress bar element
  const progressBar = document.getElementById('progress');

  // Update the width of the progress bar based on the received progress
  progressBar.style.width = `${progress}%`;

  // Get a reference to the progress percentage element
  const progressPercentage = document.getElementById('progress-percentage');

  // Update the percentage displayed below the progress bar with the received progress
  progressPercentage.textContent = `${progress.toFixed(0)}%`;
});

// Set up a socket event listener for 'refreshingDataStatus' events
socket.on('refreshingDataStatus', (isRefreshing) => {
  // Log the received data refresh status
  console.log('Received data refresh status:', isRefreshing);

  // Update the refreshing data state based on the received status
  setRefreshingDataState(isRefreshing);
});

// Listen for 'dataRefreshed' events and reload the page when data is refreshed
socket.on('dataRefreshed', function () {
  location.reload();
});

// Get a reference to the progress bar element
const progressBar = document.getElementById('progress');

// Define an array of loader text options
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
  'Checking all owners and their delegates',
  'Read up on some Nouns DAO props while you wait',
];

// Define a function to update the loader text with a random option from the loaderTextOptions array
function updateLoaderText(element) {
  const randomIndex = Math.floor(Math.random() * loaderTextOptions.length);
  element.textContent = loaderTextOptions[randomIndex];
}

// Define an asynchronous function to fetch data from the server
async function fetchData() {
  // Send a GET request to the server to fetch the voting power data
  const response = await fetch('/api/voting-power-data');
  const { data, lastRun } = await response.json();

  // Add logs to check the received data and lastRun values
  // console.log('Received data:', data);
  // console.log('Received lastRun:', lastRun);

  // Update the table with the fetched data
  refreshTableData(data);

  // Wait for the DOM to update before sorting the table
  setTimeout(() => {
    // Sort the table by voting power descending
    sortTable(2, 'voting-power-table', 'desc', false);
  }, 0);

  // Update the last updated text with the last run timestamp
  updateLastUpdatedText(lastRun);
}

// Define a function to update the last updated text with the last run timestamp
function updateLastUpdatedText(timestamp) {
  const lastUpdatedElement = document.querySelector('#last-updated');
  if (timestamp) {
    lastUpdatedElement.textContent = `Table Last Updated: ${new Date(timestamp).toLocaleString()}`;
  } else {
    lastUpdatedElement.textContent = 'Table Last Updated: Unknown';
  }
}

// Define an asynchronous function to refresh the voting power data
async function refreshData() {
  // Set the refreshing data state to true
  setRefreshingDataState(true);

  try {
    // Update the loader text initially and start the interval
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

  // Set the refreshing data state to false
  setRefreshingDataState(false);
}

// Define a function to refresh the table with the new data
function refreshTableData(data) {
  const tableBody = document.getElementById('voting-power-table-body');
  tableBody.innerHTML = '';

  data.forEach(({ address, ensName, votingPower }) => {
    const row = document.createElement('tr');
    const addressCell = document.createElement('td');
    const ensNameCell = document.createElement('td');
    const votingPowerCell = document.createElement('td');

    addressCell.textContent = address;
    ensNameCell.textContent = ensName || '';
    votingPowerCell.textContent = votingPower;

    row.appendChild(addressCell);
    row.appendChild(ensNameCell);
    row.appendChild(votingPowerCell);
    tableBody.appendChild(row);
  });
}

// Define a function to start the loader text cycle and set the interval to repeat every 3 seconds
function startLoaderTextCycle() {
  const randomTextElement = document.getElementById('random-text');
  updateLoaderText(randomTextElement);
  loaderTextInterval = setInterval(() => {
    updateLoaderText(randomTextElement);
  }, 3000);
}

// Define a function to stop the loader text cycle and clear the interval
function stopLoaderTextCycle() {
  clearInterval(loaderTextInterval);
}

// Define a function to update the visibility of the loader text based on the refreshing data state
function updateLoaderTextVisibility(isRefreshing) {
  const randomTextElement = document.getElementById('random-text');
  if (isRefreshing) {
    randomTextElement.style.display = 'block';
  } else {
    randomTextElement.style.display = 'none';
  }
}

// Define a function to set the refreshing data state and update the UI accordingly
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

// When the DOM is fully loaded, set up event listeners and fetch initial data
document.addEventListener('DOMContentLoaded', async () => {
  // Get a reference to the refresh data button
  const refreshDataButton = document.getElementById('refresh-data-button');

  // Add a click event listener to the refresh data button, if it exists
  if (refreshDataButton) {
    refreshDataButton.addEventListener('click', refreshData);
  }

  // Fetch the initial voting power data
  fetchData();

  // Get the initial refresh status from the server and set the refreshing data state accordingly
  const isRefreshing = await getRefreshStatus();
  setRefreshingDataState(isRefreshing);

  // Update the loader text visibility based on the initial refresh status from the server
  updateLoaderTextVisibility(isRefreshing);

  // Add event listeners to sort the table by address, ens or voting power when the corresponding header is clicked
  document.getElementById('header-address').addEventListener('click', () => sortTable(0, 'voting-power-table'));
  document.getElementById('header-ens-name').addEventListener('click', () => sortTable(1, 'voting-power-table'));
  document.getElementById('header-voting-power').addEventListener('click', () => sortTable(2, 'voting-power-table'));

});

// Fetch the current data refresh status from the server
async function getRefreshStatus() {
  const response = await fetch('/api/voting-power/refresh-status');
  const { isRefreshing } = await response.json();
  return isRefreshing;
}

// Store the sorting state
const sortingState = {
  columnIndex: 2, // Update the initial column index to 2 (voting power)
  direction: 'desc', // Update the initial direction to 'desc'
};

// Sort the table by the specified column index and update the sorting state
function sortTable(columnIndex, tableId, initialDirection, ignoreSortingState = false) {
  const table = document.getElementById(tableId);
  const isNumeric = columnIndex === 2; // Voting power is numeric
  const prevColumnIndex = sortingState.columnIndex;

  if (ignoreSortingState) {
    sortingState.direction = initialDirection;
  } else if (prevColumnIndex === columnIndex) {
    // Reverse the sorting direction if the column is the same as the previously sorted one
    sortingState.direction = sortingState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    // Set the direction to ascending if the column has changed
    sortingState.direction = 'asc';
  }

  sortingState.columnIndex = columnIndex;

  const compareFunction = isNumeric
    ? (a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);

      if (isNaN(numA)) {
        return 1;
      }
      if (isNaN(numB)) {
        return -1;
      }

      return numB - numA;
    }
    : (a, b) => {
      // Check if a cell should be treated as empty
      const isEmpty = (value) => value === '' || value === '-' || value === 'N/A';

      // If both a and b are empty, consider them equal
      if (isEmpty(a) && isEmpty(b)) {
        return 0;
      }

      // When sorting in ascending order
      if (sortingState.direction === 'asc') {
        // If a is empty, put it at the bottom
        if (isEmpty(a)) {
          return 1;
        }

        // If b is empty, put it at the bottom
        if (isEmpty(b)) {
          return -1;
        }
      } else {
        // When sorting in descending order
        // If a is empty, put it at the bottom
        if (isEmpty(a)) {
          return -1;
        }

        // If b is empty, put it at the bottom
        if (isEmpty(b)) {
          return 1;
        }
      }

      // If both a and b have values, compare them using localeCompare
      return a.localeCompare(b);
    };

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

// Add event listener to the download CSV button to trigger the download of the voting power data in CSV format
document.getElementById('download-csv-button').addEventListener('click', async () => {
  const response = await fetch('/api/voting-power-data');
  const { data, lastRun } = await response.json();

  // Sort the data by voting power descending
  const sortedData = data.sort((a, b) => b.votingPower - a.votingPower);

  // console.log('Data used for CSV:', data);

  // Convert the data to CSV format
  const csvData = data.map(({ address, ensName, votingPower }) => `${address},${ensName || ''},${votingPower}`).join('\n');
  const csv = `Address,ENS Name,Voting Power\n${csvData}`;

  // Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'nouner-power.csv';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
