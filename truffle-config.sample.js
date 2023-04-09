const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
const privateKey = "<PRIVATEKEY>";
const endpointUrl = "<INFURAAPI>";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
    },
    goerli: {
      provider: function () {
        return new HDWalletProvider(
          //private keys array
          [privateKey],
          //url to ethereum node
          endpointUrl
        );
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 42,
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
};
