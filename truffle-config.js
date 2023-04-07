const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
const privateKey =
  "0xc495ed92ab4ec0cd574f32d6626f0632e3a80bf48a53baefa5d5032fa1f6c860";
const endpointUrl =
  "https://goerli.infura.io/v3/806123eeafee409985ed10d867e98e3e";

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
};
