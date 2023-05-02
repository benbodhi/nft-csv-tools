// Get reference to the CSV links container
const csvLinksContainer = document.getElementById('csv-links');

// When the DOM content is loaded, execute this function
document.addEventListener('DOMContentLoaded', () => {

  // Log that the DOM content has loaded
  console.log('DOM content loaded');

  // Get references to various elements
  const form = document.getElementById('nft-export-form');
  const walletAddressesTextarea = document.getElementById('wallet-addresses');
  const downloadLinksDiv = document.getElementById('csv-links');

  // Array of loading text options to randomly display while loading
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

  // Function to update the loader text with a random loading message
  function updateLoaderText(loader) {
    const randomIndex = Math.floor(Math.random() * loaderTextOptions.length);
    const randomText = loaderTextOptions[randomIndex];
    loader.innerHTML = `Loading...<br>${randomText}`;
  }

  // When the form is submitted, execute this function
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Log that the form has been submitted
    console.log('Form submitted');

    // Get an array of trimmed wallet addresses from the textarea
    const walletAddresses = walletAddressesTextarea.value.split('\n').map(address => address.trim()).filter(address => address.length > 0);

    // If no wallet addresses are entered, alert the user and return
    if (walletAddresses.length === 0) {
      console.log('No wallet addresses entered');
      alert('Please enter at least one wallet address.');
      return;
    }

    // Create loader element and add it to downloadLinksDiv
    const loader = document.createElement('div');
    loader.innerText = 'Loading...';
    downloadLinksDiv.innerHTML = '';
    downloadLinksDiv.appendChild(loader);

    // Update loader text initially and start the interval
    updateLoaderText(loader);
    const loaderTextInterval = setInterval(() => updateLoaderText(loader), 3000);

    try {
      // Send a request to the server to export NFT data for the given wallet addresses
      console.log('Sending request to /export-nfts');
      const response = await fetch('/export-nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddresses })
      });

      // If the response is successful, display the download links
      if (response.ok) {
        console.log('Response OK');
        const results = await response.json();
        displayDownloadLinks(results);
      } else {
        throw new Error(`Error exporting NFTs: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      // If an error occurs, log it and alert the user
      console.log('Error occurred:', error);
      alert(`Error: ${error.message}`);
    } finally {
      // Remove loader and clear the interval
      loader.remove();
      clearInterval(loaderTextInterval);
    }
  });

  // Function to display the download links for the exported data
  function displayDownloadLinks(results) {
    console.log('Results:', results);

    csvLinksContainer.innerHTML = '';

    results.forEach(result => {
      console.log(`Creating download links for wallet address: ${result.walletAddress}`);

      // Extract the data and create blobs
      const walletAddress = result.walletAddress;
      const nftCSV = result.nftCSV;
      const tokenReferenceCSV = result.tokenReferenceCSV;

      // Create download links for the CSVs
      const nftBlob = new Blob([nftCSV], { type: 'text/csv;charset=utf-8;' });
      const tokenReferenceBlob = new Blob([tokenReferenceCSV], { type: 'text/csv;charset=utf-8;' });

      const nftLink = document.createElement('a');
      const tokenReferenceLink = document.createElement('a');

      nftLink.href = URL.createObjectURL(nftBlob);
      nftLink.download = `nfts_${walletAddress}.csv`;
      nftLink.textContent = `Download NFT CSV for ${walletAddress}`;
      nftLink.classList.add('button');

      tokenReferenceLink.href = URL.createObjectURL(tokenReferenceBlob);
      tokenReferenceLink.download = `token_reference_${walletAddress}.csv`;
      tokenReferenceLink.textContent = `Download Token Reference CSV for ${walletAddress}`;
      tokenReferenceLink.classList.add('button');

      // Create a container element and append the download links to it
      const div = document.createElement('div');
      div.appendChild(nftLink);
      div.appendChild(document.createElement('br'));
      div.appendChild(tokenReferenceLink);

      // Append the container to the CSV links container
      csvLinksContainer.appendChild(div);
      csvLinksContainer.appendChild(document.createElement('br'));

      // Log that the download links have been created for the wallet address
      console.log('Download links created for wallet address:', result.walletAddress);
    });

    // Log the CSV links container
    console.log('Download Links Div:', csvLinksContainer);

    // Display the CSV links container
    csvLinksContainer.style.display = 'block';
  }

});