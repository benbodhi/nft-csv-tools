// When the DOM content is loaded, execute this function
document.addEventListener('DOMContentLoaded', () => {

  // Get reference to the CSV links container
  const csvLinksContainer = document.getElementById('csv-links');

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

  // Load noggles loader svg inline
  async function loadInlineSVG() {
    const response = await fetch('noggles-loading.svg');
    const svgContent = await response.text();

    document.getElementById('noggles-loading').innerHTML = svgContent;

    // animate the SVG
    animateNogglesLoading();
  }

  // Declare a variable to store the interval ID
  let animationInterval;

  // Animation for noggles loading SVG
  async function animateNogglesLoading() {

    // Clear any existing interval
    if (animationInterval) {
      clearInterval(animationInterval);
    }

    const states = document.getElementsByClassName('noggle-animation-state')
    const total = states.length
    let currentId = 1
    animationInterval = setInterval(() => {
      if (currentId === total) currentId = 1
      else currentId++
      for (const state of states) {
        const id = Number(state.id.slice(6))
        if (id === currentId) state.style.display = 'block'
        else state.style.display = 'none'
      }
    }, 100);
  }

  // When the form is submitted, execute this function
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get an array of trimmed wallet addresses from the textarea
    const walletAddresses = walletAddressesTextarea.value.split('\n').map(address => address.trim()).filter(address => address.length > 0);

    // If no wallet addresses are entered, alert the user and return
    if (walletAddresses.length === 0) {
      alert('Please enter at least one wallet address.');
      return;
    }

    // Create loader element and add it to downloadLinksDiv
    const loader = document.createElement('div');
    downloadLinksDiv.innerHTML = '';
    downloadLinksDiv.appendChild(loader);

    // Add inline SVG and start the animation
    loader.innerHTML = `<div id="noggles-loading"></div>`;
    loadInlineSVG();

    try {
      // Send a request to the server to export NFT data for the given wallet addresses
      const response = await fetch('/export-nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddresses })
      });

      // If the response is successful, display the download links
      if (response.ok) {
        const results = await response.json();
        displayDownloadLinks(results);
      } else {
        throw new Error(`Error exporting NFTs: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      // If an error occurs, log it and alert the user
      alert(`Error: ${error.message}`);
    } finally {
      // Remove loader
      loader.remove();
    }
  });

  // Function to display the download links for the exported data
  function displayDownloadLinks(results) {

    csvLinksContainer.innerHTML = '';

    results.forEach(result => {

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

      // Select csv-links container and append the download links to it
      const div = document.getElementById('csv-links');
      div.appendChild(nftLink);
      div.appendChild(tokenReferenceLink);
    });

    // Display the CSV links container
    csvLinksContainer.style.display = 'block';
  }
});