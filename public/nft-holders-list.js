const tokenForm = document.getElementById('token-form');
const contractAddressInput = document.getElementById('contract-address');
const tokenIdsInput = document.getElementById('token-ids');
const csvLinksContainer = document.getElementById('csv-links');
const downloadAllLink = document.getElementById('download-all');
const tokenRangeInput = document.getElementById('token-range');
const tokenDateRangeInput = document.getElementById('token-date-range');
const optionalInputs = [tokenIdsInput, tokenRangeInput, tokenDateRangeInput];

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

function updateLoaderText(loader) {
  const randomIndex = Math.floor(Math.random() * loaderTextOptions.length);
  const randomText = loaderTextOptions[randomIndex];
  loader.innerHTML = `Loading...<br>${randomText}`;
}

const inputs = document.querySelectorAll('.input-container input');

// Get the "fetch-all" checkbox element
const fetchAllCheckbox = document.getElementById('fetch-all');

inputs.forEach(input => {
  const clearIcon = input.nextElementSibling;

  clearIcon.addEventListener('click', () => {
    input.value = '';
  });
});

function clearOtherInputs(currentInput) {
  optionalInputs.filter(other => other !== currentInput).forEach(other => {
    other.value = '';
  });
}

function validateTokenIds(tokenIds) {
  if (!tokenIds) {
    return false;
  }
  const idsPattern = /^\d+(,\s*\d+)*$/;
  return idsPattern.test(tokenIds);
}

function validateTokenRange(tokenRange) {
  if (!tokenRange) {
    return false;
  }
  const rangePattern = /^\d+\s*-\s*\d+$/;
  return rangePattern.test(tokenRange);
}

function validateTokenDateRange(tokenDateRange) {
  if (!tokenDateRange) {
    return false;
  }
  const dateRangePattern = /^\d{4}-\d{2}-\d{2}\s*to\s*\d{4}-\d{2}-\d{2}$/;
  return dateRangePattern.test(tokenDateRange);
}

function validateOptionalInputs() {
  for (const input of optionalInputs) {
    if (input.value.trim() !== '') {
      return true;
    }
  }
  return fetchAllCheckbox.checked;
}

optionalInputs.forEach(input => {
  input.addEventListener('focus', () => {
    if (input.value.trim() === '') {
      clearOtherInputs(input);
    }
  });

  input.addEventListener('input', () => {
    if (input.value.trim() !== '') {
      clearOtherInputs(input);
    }
  });
});

const litepicker = new Litepicker({
  element: tokenDateRangeInput,
  format: 'YYYY-MM-DD',
  delimiter: ' to ',
  singleMode: false,
  autoApply: false,
  numberOfMonths: 2,
  numberOfColumns: 2,
  disableMobile: true,
  onSelect: (start, end) => {
    tokenDateRangeInput.value = start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD');
  }
});

let numTokenIdsProcessed = 0;

async function createCSV(tokenId, holders, ownerType) {
  // Increment the number of token IDs processed
  numTokenIdsProcessed++;

  const csvContent = `data:text/csv;charset=utf-8,${holders.map(([h, value]) => `${h}`).join('\n')}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const fileNamePrefix = ownerType === 'original' ? 'original_minters' : 'current_owners';
  const contractAddress = contractAddressInput.value.trim();
  link.setAttribute('download', `${contractAddress}_token_${tokenId}_${fileNamePrefix}.csv`);
  link.innerText = `Download CSV for Token ID ${tokenId}`;
  link.classList.add('button');
  csvLinksContainer.appendChild(link);
  const lineBreak = document.createElement('br');
  csvLinksContainer.appendChild(lineBreak);

  // Hide the "Download Combined CSV" button & "Download All" button when processing a single token ID
  if (numTokenIdsProcessed === 1) {
    downloadAllLink.classList.add('hidden');
    document.getElementById('download-combined').classList.add('hidden');
  } else {
    downloadAllLink.classList.remove('hidden');
    document.getElementById('download-combined').classList.remove('hidden');
  }

  return link;
}

function createCombinedCSV(tokenHolders, ownerType) {
  const combinedHolders = new Set();
  tokenHolders.forEach(({ tokenId, holders }) => {
    holders.forEach(([h, value]) => combinedHolders.add(h));
  });
  const csvContent = `data:text/csv;charset=utf-8,${Array.from(combinedHolders).join('\n')}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.getElementById('download-combined');
  link.setAttribute('href', encodedUri);
  const fileNamePrefix = ownerType === 'original' ? 'original_minters' : 'current_owners';
  const contractAddress = contractAddressInput.value.trim();
  link.setAttribute('download', `${contractAddress}_combined_${fileNamePrefix}.csv`);
  link.classList.remove('hidden');
}

contractAddressInput.addEventListener('input', () => {
  const isContractAddressFilled = contractAddressInput.value.trim() !== '';
  tokenIdsInput.disabled = !isContractAddressFilled;
  tokenRangeInput.disabled = !isContractAddressFilled;
  tokenDateRangeInput.disabled = !isContractAddressFilled;
});

tokenForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  numTokenIdsProcessed = 0;

  // Initially hide the "Download Combined CSV" button & "Download All" button
  document.getElementById('download-combined').classList.add('hidden');
  document.getElementById('download-all').classList.add('hidden');

  // Validate optional inputs
  if (!validateOptionalInputs()) {
    alert('Please fill in at least one of the optional ID fields or select "Fetch all tokens from this contract".');
    return;
  }

  // Validate token IDs format
  if (tokenIdsInput.value && !validateTokenIds(tokenIdsInput.value)) {
    alert('Invalid Token IDs format. Please use a comma-separated list of numbers (e.g., "1,2,3")');
    return;
  }

  // Validate token range format
  if (tokenRangeInput.value && !validateTokenRange(tokenRangeInput.value)) {
    alert('Invalid Token ID Range format. Please use the format: "start-end" (e.g., "1-100")');
    return;
  }

  // Validate date range format
  if (tokenDateRangeInput.value && !validateTokenDateRange(tokenDateRangeInput.value)) {
    alert('Invalid Token Date Range format. Please use the format: "YYYY-MM-DD to YYYY-MM-DD" (e.g., "2022-01-01 to 2022-12-31")');
    return;
  }

  csvLinksContainer.innerHTML = '';

  const submitButton = document.getElementById('submit-button');
  submitButton.disabled = true;
  const loader = document.createElement('div');
  loader.innerText = 'Loading...';
  csvLinksContainer.appendChild(loader);

  // Update the loader text initially
  updateLoaderText(loader);

  // Update the loader text every 3 seconds
  const loaderTextInterval = setInterval(() => updateLoaderText(loader), 3000);

  const ownerTypeInput = document.getElementsByName('owner-type');
  let ownerType = 'original';

  for (const radio of ownerTypeInput) {
    if (radio.checked) {
      ownerType = radio.value;
    }
  }

  const contractAddress = contractAddressInput.value.trim();
  const tokenIds = tokenIdsInput.value ? tokenIdsInput.value.split(',').map(tokenId => tokenId.trim()) : [];
  const tokenRange = tokenRangeInput.value.trim();
  const tokenDateRange = tokenDateRangeInput.value.trim();
  const [tokenDateStart, tokenDateEnd] = tokenDateRange.split('to').map(date => date.trim());
  const combined = false;

  // Get the fetchAll value
  const fetchAll = fetchAllCheckbox.checked;

  // Update the POST request body to include the "fetchAll" flag
  const response = await fetch('/fetch-token-holders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ contractAddress, tokenIds, tokenRange, tokenDateStart, tokenDateEnd, combined, ownerType, fetchAll })
  });

  const tokenHolders = await response.json();
  console.log('Received token holders:', tokenHolders);

  csvLinksContainer.innerHTML = '';
  loader.remove();

  const csvLinks = [];
  tokenHolders.forEach(({ tokenId, holders }) => {
    const link = createCSV(tokenId, holders, ownerType);
    csvLinks.push(link);
  });

  // Show the "Download Combined CSV" button and "Download All" button only if more than one token holder
  if (tokenHolders.length > 1) {
    createCombinedCSV(tokenHolders, ownerType);
    document.getElementById('download-combined').classList.remove('hidden');
    document.getElementById('download-all').classList.remove('hidden');
  }

  submitButton.disabled = false;

  // Clear the interval when the loading is done
  clearInterval(loaderTextInterval);
});

downloadAllLink.addEventListener('click', async (event) => {
  event.preventDefault();

  const zip = new JSZip();

  // Add all individual CSV files
  const allLinks = Array.from(csvLinksContainer.querySelectorAll('a'));
  for (const link of allLinks) {
    const response = await fetch(link.href);
    const text = await response.text();
    const filename = link.getAttribute('download');
    zip.file(filename, text);
  }

  // Add the combined CSV file
  const combinedLink = document.getElementById('download-combined');
  const response = await fetch(combinedLink.href);
  const text = await response.text();
  const filename = combinedLink.getAttribute('download');
  zip.file(filename, text);

  // Get ownerType
  const ownerTypeInput = document.getElementsByName('owner-type');
  let ownerType = 'original';
  for (const radio of ownerTypeInput) {
    if (radio.checked) {
      ownerType = radio.value;
    }
  }

  // Generate and download the ZIP file
  const content = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(content);
  const tempLink = document.createElement('a');
  tempLink.href = zipUrl;
  const fileNamePrefix = ownerType === 'original' ? 'original_minters' : 'current_owners';
  const contractAddress = contractAddressInput.value.trim();
  tempLink.setAttribute('download', `${contractAddress}_all_${fileNamePrefix}.zip`);
  tempLink.style.display = 'none';
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('download-combined button class list:', document.getElementById('download-combined').classList);
  console.log('download-all button class list:', document.getElementById('download-all').classList);
});

// TODO support for erc-1155
// TODO better progress update info for user
// TODO make sure we don't bother processing beyond existing tokens - maybe check total tokens before iterating through non existent ones for better performance.