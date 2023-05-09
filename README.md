# Ethereum NFT CSV Builder Tools

This repository is for the NFT CSV Tools web app which contains a collection of tools for extracting various kinds of data from the Ethereum network and exporting them into CSV files for various use cases.

The tools are mainly for working with ERC-721 tokens and have specific functionalities tailored towards aiding operations like airdrops, token gating, allowlisting for holders/minters of a specific token, and more.

See it in action at: [https://nftcsv.tools](https://nftcsv.tools)

## Features

1. **Token Holder/Minter Extractor**: This tool allows for inputting a token contract address (erc-721 on the Ethereum network) and either specifying or fetching token IDs to output lists of holders or original minters. This is particularly useful for airdrops, token gating, or allowlisting for holders/minters of a specific token.

2. **NFT Wallet Scanner**: This tool scans any Ethereum wallet address for NFTs and exports a CSV file with a list in a format ready for [Safe](https://safe.global/)'s CSV Airdrop app. It also provides an option to save a reference file for each address, providing information on which token contract is which by name and how many total tokens of each contract are held.

3. **Nouns DAO Voting Power Tracker**: This tool exports a list of wallets with voting power at [Nouns DAO](https://nouns.wtf) to a CSV file. Additionally, you can download a "Vote Tracker CSV" with this data, as well as extra columns to help with tracking proposal votes and rallying nouners for your proposal.

## Usage

### Visit The Website
[https://nftcsv.tools](https://nftcsv.tools)

### Token Holder/Minter Extractor

1. Paste the token contract address in the first field.
2. Use any one of the next 3 fields or the "fetch all" checkbox to specify the token IDs to get holder/minter addresses for.
3. Select whether you want the current token holder or the original minter address.
4. Press the "Fetch Token Holders" button and wait.
5. Download whichever CSVs you want when the buttons show up.

**Note**: Only ERC-721 is supported for now.

### NFT Wallet Scanner

1. Enter the wallet address/es (one per line for multiple) in the first field.
2. Hit the "Export List of NFTs" button and wait.
3. Download your CSV files.

### Nouns DAO Voting Power Tracker

1. Simply press the "Export Voting Power" button and wait.
2. Download your CSV files.

## Development

To get the project running locally on your machine, follow these steps:

1. **Fork the repository**: Fork this repository to your own GitHub account using the GitHub website or GitHub Desktop.

2. **Clone the repository**: After you've forked the repository, clone it to your local machine. Replace `<YourUsername>` with your GitHub username.
    ```bash
    git clone https://github.com/<YourUsername>/nft-csv-tools.git
    ```

3. **Install the project dependencies**: Navigate to the project directory and install the dependencies.
    ```bash
    cd nft-csv-tools
    npm install
    ```

4. **Start the server**: Use the following command to start the server.
    ```bash
    node server.js
    ```

5. **Switch to Node.js version 16** (optional): The project *may* face issues on Node.js version 17. If you face any issues using version 17, it's advised to switch to version 16 and restart the server.
    ```bash
    nvm use 16
    node server.js
    ```

## Open Source and License

This project is completely open source, released into the public domain with the [Unlicense](http://unlicense.org/). There are no restrictions on what you can do with this software. Use it as you please with no restrictions.

While there are no specific licensing restrictions or contribution guidelines, if you find the tools useful and make improvements, I encourage you to share your enhancements with me and/or the community.