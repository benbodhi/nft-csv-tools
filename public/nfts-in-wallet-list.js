const csvLinksContainer = document.getElementById('csv-links');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');

  const form = document.getElementById('nft-export-form');
  const walletAddressesTextarea = document.getElementById('wallet-addresses');
  const downloadLinksDiv = document.getElementById('csv-links');

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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Form submitted');

    const walletAddresses = walletAddressesTextarea.value.split('\n').map(address => address.trim()).filter(address => address.length > 0);

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
      console.log('Sending request to /export-nfts');
      const response = await fetch('/export-nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddresses })
      });

      if (response.ok) {
        console.log('Response OK');
        const results = await response.json();
        displayDownloadLinks(results);
      } else {
        throw new Error(`Error exporting NFTs: ${response.status}, ${response.statusText}`);
      }
    } catch (error) {
      console.log('Error occurred:', error);
      alert(`Error: ${error.message}`);
    } finally {
      // Remove loader and clear the interval
      loader.remove();
      clearInterval(loaderTextInterval);
    }
  });

  function displayDownloadLinks(results) {
    console.log('Results:', results);

    csvLinksContainer.innerHTML = '';

    results.forEach(result => {
      console.log(`Creating download links for wallet address: ${result.walletAddress}`);

      const walletAddress = result.walletAddress;
      const nftCSV = result.nftCSV;
      const tokenReferenceCSV = result.tokenReferenceCSV;

      const nftBlob = new Blob([nftCSV], { type: 'text/csv;charset=utf-8;' });
      const tokenReferenceBlob = new Blob([tokenReferenceCSV], { type: 'text/csv;charset=utf-8;' });

      const nftLink = document.createElement('a');
      const tokenReferenceLink = document.createElement('a');

      nftLink.href = URL.createObjectURL(nftBlob);
      nftLink.download = `nfts_${walletAddress}.csv`;
      nftLink.textContent = `Download NFT CSV for ${walletAddress}`;
      nftLink.classList.add('button'); // Add the button class

      tokenReferenceLink.href = URL.createObjectURL(tokenReferenceBlob);
      tokenReferenceLink.download = `token_reference_${walletAddress}.csv`;
      tokenReferenceLink.textContent = `Download Token Reference CSV for ${walletAddress}`;
      tokenReferenceLink.classList.add('button'); // Add the button class

      const div = document.createElement('div');
      div.appendChild(nftLink);
      div.appendChild(document.createElement('br'));
      div.appendChild(tokenReferenceLink);

      csvLinksContainer.appendChild(div);
      csvLinksContainer.appendChild(document.createElement('br'));
      console.log('Download links created for wallet address:', result.walletAddress);
    });

    console.log('Download Links Div:', csvLinksContainer);

    csvLinksContainer.style.display = 'block';
  }


});