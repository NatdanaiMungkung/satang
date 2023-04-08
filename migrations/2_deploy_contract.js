const SimpleBank = artifacts.require("SimpleBank");
const STT = artifacts.require("STT");

module.exports = async function (deployer) {
  const initialSupply = web3.utils.toBN("1000000000000000000000000"); // 1 million tokens with 18 decimals
  await deployer.deploy(STT, initialSupply);
  const sttInstance = await STT.deployed();
  await deployer.deploy(SimpleBank, sttInstance.address);

  // Get the SimpleBank contract instance
  const simpleBankInstance = await SimpleBank.deployed();

  // You can now interact with the deployed contracts using their respective instances
  console.log("STT contract address:", sttInstance.address);
  console.log("SimpleBank contract address:", simpleBankInstance.address);
};
