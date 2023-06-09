// Load environment variables from the .env file
require('dotenv').config();

// Import required modules
const http = require('http');
const socketIO = require('socket.io');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Web3 = require('web3');
const namehash = require('eth-ens-namehash');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { MongoClient } = require('mongodb');

// Create express app and configure HTTP server
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIO(server);
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist/'));

// Start the server and listen for connections
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Configure middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Set up MongoDB connection string
const uri = process.env.MONGODB_CONNECTION_STRING;

// Connect to MongoDB
async function connectToDB() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db('nftcsvtools');
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return null;
  }
}

/**
 * NFT Holders List page
 */
// Fetch minted token IDs by date range
async function fetchMintedTokenIdsByDateRange(contractAddress, tokenDateStart, tokenDateEnd, apiKey, ownerType) {
  const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`;
  const response = await axios.get(url);
  const transfers = response.data.result;

  const tokenDataByTokenId = new Map();

  transfers.forEach(tx => {
    const txDate = new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0];
    const isMintTransaction = tx.from === '0x0000000000000000000000000000000000000000';
    if ((!tokenDateStart || txDate >= tokenDateStart) && (!tokenDateEnd || txDate <= tokenDateEnd) && isMintTransaction) {
      const tokenId = parseInt(tx.tokenID);
      const toAddress = tx.to;

      if (ownerType === 'current') {
        if (tokenDataByTokenId.has(tokenId)) {
          const oldToAddress = tokenDataByTokenId.get(tokenId).toAddress;
          if (oldToAddress === '0x0000000000000000000000000000000000000000') {
            tokenDataByTokenId.set(tokenId, { toAddress });
          }
        } else {
          if (toAddress !== '0x0000000000000000000000000000000000000000') {
            tokenDataByTokenId.set(tokenId, { toAddress });
          }
        }
      } else {
        tokenDataByTokenId.set(tokenId, { toAddress });
      }
    }
  });

  const tokenIds = Array.from(tokenDataByTokenId.keys());

  if (ownerType === 'current') {
    return tokenIds.filter(tokenId => tokenDataByTokenId.get(tokenId).toAddress !== '0x0000000000000000000000000000000000000000');
  } else {
    return tokenIds;
  }
}

// Fetch all token IDs
async function fetchAllTokenIds(contractAddress, apiKey) {
  const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`;
  const response = await axios.get(url);
  const transfers = response.data.result;

  const tokenIds = new Set();

  transfers.forEach(tx => {
    const tokenId = parseInt(tx.tokenID);
    tokenIds.add(tokenId);
  });

  return Array.from(tokenIds);
}

// Fetch token holders endpoint
app.post('/fetch-token-holders', async (req, res) => {
  // console.log('Fetch-token-holders endpoint hit');
  // console.time('totalFetchTokenHolders');

  const { contractAddress, tokenIds, tokenRange, tokenDateStart, tokenDateEnd, combined, ownerType, fetchAll } = req.body;
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const web3 = new Web3();
  const tokenHolders = [];

  let tokenIdsToFetch = tokenIds || [];

  // console.time('fetchTokenIds');
  if (fetchAll) {
    tokenIdsToFetch = await fetchAllTokenIds(contractAddress, apiKey);
  } else {
    if (tokenDateStart && tokenDateEnd) {
      tokenIdsToFetch = await fetchMintedTokenIdsByDateRange(contractAddress, tokenDateStart, tokenDateEnd, apiKey, ownerType);
    }

    if (tokenRange) {
      const [start, end] = tokenRange.split('-').map(Number);
      const rangeIds = [];
      for (let i = start; i <= end; i++) {
        rangeIds.push(i);
      }
      tokenIdsToFetch = tokenIdsToFetch.concat(rangeIds);
    }
  }
  // console.timeEnd('fetchTokenIds');

  // console.log('Fetching token holders for:', {
  //   contractAddress,
  //   dateRange: [tokenDateStart, tokenDateEnd],
  //   tokenIds: tokenIdsToFetch,
  //   ownerType
  // });

  const allHolders = new Map();

  // console.time('fetchHolders');

  for (const tokenId of tokenIdsToFetch) {
    const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}&tokenId=${tokenId}`;

    const start = Date.now();
    const response = await axios.get(url);
    const duration = Date.now() - start;

    console.log(`Call to Etherscan API for token ID ${tokenId} took ${duration} ms`);

    const transfers = response.data.result.filter(tx => parseInt(tx.tokenID) === parseInt(tokenId));

    const holders = new Map();

    // console.log(`Token ID ${tokenId} transfers:`, transfers);

    for (const tx of transfers) {
      const isMintTransaction = tx.from === '0x0000000000000000000000000000000000000000';

      if (ownerType === 'original' && !isMintTransaction) {
        continue;
      }

      // console.log(`Token ID ${tokenId} transfer from ${tx.from} to ${tx.to}`);

      if (ownerType === 'current') {
        if (isMintTransaction) {
          holders.set(tx.to, tokenId);
          // console.log(`(1) Setting holder (original minter) ${tx.to} for Token ID ${tokenId}`);
        } else {
          holders.delete(tx.from);
          // console.log(`Removing Previous Holder ${tx.from} for Token ID ${tokenId}`);
          holders.set(tx.to, tokenId);
          // console.log(`(2) Setting holder (new owner) ${tx.to} for Token ID ${tokenId}`);
        }
      } else {
        if (isMintTransaction) {
          holders.set(tx.to, tokenId);
          // console.log(`(3) Setting holder (original minter) ${tx.to} for Token ID ${tokenId}`);
        }
      }
    }

    if (combined) {
      for (const [holder, tokenId] of holders.entries()) {
        if (allHolders.has(holder)) {
          const oldTokenIds = allHolders.get(holder);
          allHolders.set(holder, oldTokenIds.concat(tokenId));
        } else {
          allHolders.set(holder, [tokenId]);
        }
      }
    } else {
      tokenHolders.push({ tokenId, holders: Array.from(holders.entries()) });
    }
  }
  // console.timeEnd('fetchHolders');

  // console.timeEnd('totalFetchTokenHolders');

  if (combined) {
    res.json([{ tokenId: 'combined', holders: Array.from(allHolders.entries()) }]);
  } else {
    res.json(tokenHolders);
  }
});

/**
 * NFTs in Wallet
 */
// Fetch NFTs for a wallet address
async function fetch_nfts(walletAddress, apiKey) {
  const url = `https://api.etherscan.io/api?module=account&action=tokennfttx&address=${walletAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`;
  const response = await axios.get(url);

  if (response.status === 200) {
    const allNfts = response.data.result;

    const ownedNftsMap = new Map();

    // Iterate over all NFT transactions
    for (const nft of allNfts) {
      const key = `${nft.contractAddress}-${nft.tokenID}`;

      if (nft.to.toLowerCase() === walletAddress.toLowerCase()) {
        // If the NFT was transferred to the wallet, add it to the map
        ownedNftsMap.set(key, nft);
      } else if (nft.from.toLowerCase() === walletAddress.toLowerCase()) {
        // If the NFT was transferred from the wallet, remove it from the map
        ownedNftsMap.delete(key);
      }
    }

    const ownedNfts = Array.from(ownedNftsMap.values());

    console.log(`Fetched ${ownedNfts.length} NFTs for wallet address: ${walletAddress}`);

    return ownedNfts;
  } else {
    throw new Error(`Error fetching NFTs: ${response.status}, ${response.statusText}`);
  }
}

// Export CSV of NFTs held by wallet
function nftsToCSV(nfts, tokenReference = false) {
  const fieldnames = tokenReference
    ? ["token_address", "token_name", "token_count"]
    : ["token_type", "token_address", "receiver", "amount", "id"];

  const headers = fieldnames.join(',') + '\n';

  const nftMap = new Map();

  const rows = nfts.map(nft => {
    if (tokenReference) {
      const tokenAddress = nft.contractAddress;
      const tokenName = `"${nft.tokenName.replace(/"/g, '""')}"`; // Wrap token name in double quotes and escape inner double quotes

      if (nftMap.has(tokenAddress)) {
        nftMap.set(tokenAddress, { token_name: tokenName, token_count: nftMap.get(tokenAddress).token_count + 1 });
      } else {
        nftMap.set(tokenAddress, { token_name: tokenName, token_count: 1 });
      }
      return;
    } else {
      return [
        "nft",
        nft.contractAddress,
        "",
        "",
        nft.tokenID
      ].join(',');
    }
  }).filter(Boolean).join('\n');

  if (tokenReference) {
    const tokenRows = Array.from(nftMap.entries()).map(([token_address, { token_name, token_count }]) => {
      return [token_address, token_name, token_count].join(',');
    }).join('\n');

    return headers + tokenRows;
  } else {
    return headers + rows;
  }
}

// Export NFTs endpoint
app.post('/export-nfts', async (req, res) => {
  const { walletAddresses } = req.body;
  const apiKey = process.env.ETHERSCAN_API_KEY;

  const results = [];

  for (const walletAddress of walletAddresses) {
    // console.log(`Fetching NFTs for wallet address: ${walletAddress}`);
    const nfts = await fetch_nfts(walletAddress, apiKey);
    const nftCSV = nftsToCSV(nfts);
    const tokenReferenceCSV = nftsToCSV(nfts, true);
    results.push({ walletAddress, nftCSV, tokenReferenceCSV });
  }

  res.json(results);
});

/**
 * Nouns Voting Power
 */
// Resolve NNS/ENS names using addresses
async function resolveName(address) {
  try {
    const providerUrl = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;
    const web3 = new Web3(providerUrl);

    const nnsRegistryAddress = '0x3e1970dc478991b49c4327973ea8a4862ef5a4de'; // NNS registry address
    const ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'; // ENS registry address on Ethereum mainnet

    const registryABI = [
      {
        constant: true,
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'resolver',
        outputs: [{ name: 'resolverAddress', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
      }
    ];

    const resolverABI = [
      {
        constant: true,
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'name',
        outputs: [{ name: 'resolvedName', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
      }
    ];

    const reverseName = address.slice(2).toLowerCase() + '.addr.reverse';
    const node = namehash.hash(reverseName);

    // Try resolving the name using NNS first
    const nnsRegistryContract = new web3.eth.Contract(registryABI, nnsRegistryAddress);
    const nnsResolverAddress = await nnsRegistryContract.methods.resolver(node).call();

    if (nnsResolverAddress !== '0x0000000000000000000000000000000000000000') {
      const nnsResolverContract = new web3.eth.Contract(resolverABI, nnsResolverAddress);
      const nnsName = await nnsResolverContract.methods.name(node).call();
      if (isValidName(nnsName)) {
        return nnsName;
      }
    }

    // Fall back to ENS if NNS name is not found or not valid
    const ensRegistryContract = new web3.eth.Contract(registryABI, ensRegistryAddress);
    const ensResolverAddress = await ensRegistryContract.methods.resolver(node).call();

    if (ensResolverAddress !== '0x0000000000000000000000000000000000000000') {
      const ensResolverContract = new web3.eth.Contract(resolverABI, ensResolverAddress);
      const ensName = await ensResolverContract.methods.name(node).call();
      if (isValidName(ensName)) {
        return ensName;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error resolving name for address: ${address}`);
    return null;
  }
}

function isValidName(name) {
  return (
    name &&
    name !== '' &&
    !name.endsWith('.addr.reverse') &&
    name !== '0x0000000000000000000000000000000000000000'
  );
}

// Get voting power data from the database
async function getVotingPowerDataFromDB() {
  const db = await connectToDB();
  if (!db) {
    console.error("Couldn't connect to the database");
    return;
  }

  const votingPowerCollection = db.collection('voting_power');
  const data = await votingPowerCollection.find({}).toArray();

  const metadataCollection = db.collection('metadata');
  const lastRunResult = await metadataCollection.findOne({ key: 'last_run_timestamp' });
  const lastRun = lastRunResult ? lastRunResult.value : null;

  return { data, lastRun };
}

// Save voting power data to the database
async function saveVotingPowerData(votingPowerData) {
  const db = await connectToDB();
  if (!db) {
    console.error("Couldn't connect to the database");
    return;
  }

  const votingPowerCollection = db.collection('voting_power');

  // Remove all the previous data
  await votingPowerCollection.deleteMany({});

  // Save the new data
  await votingPowerCollection.insertMany(votingPowerData);

  // Update the last run timestamp
  const metadataCollection = db.collection('metadata');
  await metadataCollection.updateOne(
    { key: 'last_run_timestamp' },
    { $set: { value: new Date() } },
    { upsert: true }
  );

  // console.log('Voting power data saved to MongoDB');
  io.sockets.emit('dataRefreshed');
}

let isRefreshingData = false;

// Fetch voting power data
const fetchVotingPowerData = async (io) => {
  isRefreshingData = true;

  const apiKey = process.env.INFURA_API_KEY;
  const contractAddress = '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03'; // Nouns DAO contract address
  const abiPath = path.resolve(__dirname, 'ABI-nouns-token.json');
  const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

  try {
    const providerUrl = `https://mainnet.infura.io/v3/${apiKey}`;
    const web3 = new Web3(providerUrl);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Fetch the total supply of Nouns tokens
    const totalSupply = await contract.methods.totalSupply().call();

    // Fetch the token owners and delegates
    const ownersAndDelegates = [];
    for (let i = 0; i < totalSupply; i++) {
      const tokenId = await contract.methods.tokenByIndex(i).call();
      const owner = await contract.methods.ownerOf(tokenId).call();
      const delegatedAddress = await contract.methods.delegates(owner).call();

      ownersAndDelegates.push({
        tokenId: tokenId.toString(),
        owner,
        delegate: delegatedAddress === '0x0000000000000000000000000000000000000000' ? null : delegatedAddress
      });

      // Set progress
      const progress = ((i + 1) / totalSupply) * 100;

      // Log progress in the console
      // console.log(`Progress: ${progress.toFixed(2)}% (${i + 1}/${totalSupply})`);

      // Log progress emission
      // console.log('Emitting progress:', progress);

      // Emit progress update via socket
      io.emit('progress', progress);

      // Log current item being processed
      // console.log(`Current item: Token ID: ${tokenId}, Owner: ${owner}, Delegate: ${delegatedAddress}`);
    }

    // Combine owners and delegates and calculate voting power for each address
    const votingPowerMap = new Map();
    ownersAndDelegates.forEach(({ owner, delegate }) => {
      const address = delegate || owner;
      votingPowerMap.set(address, (votingPowerMap.get(address) || 0) + 1);
    });

    // Convert the votingPowerMap to an array of objects
    const votingPowerDataPromises = Array.from(votingPowerMap.entries()).map(async ([address, votingPower]) => {
      const ensName = await resolveName(address);
      // console.log(`Processing ENS name for address ${address}: ${ensName}`);
      return {
        address,
        votingPower,
        ensName
      };
    });

    const resolvedVotingPowerData = await Promise.all(votingPowerDataPromises);

    // Save the voting power data to the MongoDB collection
    await saveVotingPowerData(resolvedVotingPowerData);

    isRefreshingData = false;
    return resolvedVotingPowerData;
  } catch (error) {
    console.error('Error fetching data:', error);
    isRefreshingData = false;
    return [];
  }
};

let fetchedData = [];

// Voting power data endpoint
app.get('/api/voting-power', async (req, res) => {
  if (!fetchedData.length) {
    fetchedData = await fetchVotingPowerData(io);
  }
  res.json(fetchedData);
});

app.get('/api/voting-power/refresh-status', (req, res) => {
  res.json({ isRefreshing: isRefreshingData });
});

app.get('/api/voting-power-data', async (req, res) => {
  const { data, lastRun } = await getVotingPowerDataFromDB();
  res.json({ data, lastRun });
});

app.post('/api/voting-power/refresh', async (req, res) => {
  if (isRefreshingData) {
    return res.status(409).json({ message: 'Data is already being refreshed.' });
  }

  fetchedData = await fetchVotingPowerData(io);
  res.json({ message: 'Data refreshed successfully.' });
});