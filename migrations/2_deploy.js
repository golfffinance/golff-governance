// ++++++++++++++++ Define Contracts ++++++++++++++++ 

//Token First
const GDAODelegate = artifacts.require("GDAODelegate");
const GDAODelegator = artifacts.require("GDAODelegator");
const Timelock = artifacts.require("Timelock");
const GovernorAlpha = artifacts.require("GovernorAlpha");

// ++++++++++++++++  Main Migration ++++++++++++++++ 

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployToken(deployer, network, accounts),
  ]);
};

module.exports = migration;

// ++++++++++++++++  Deploy Functions ++++++++++++++++ 
async function deployToken(deployer, network, accounts) {
  let deploy_account = accounts[0];
  let gas_price = 1000000000;
  
  // 1. GDAODelegate
  await deployer.deploy(GDAODelegate);
  let gdaoDelegateAddress = GDAODelegate.address;

  // 2. GDAODelegator(GDAO)
  let decimals = 8;
  let totalSupply = 100000;
  let init = web3.utils.toBN(10 ** decimals).mul(web3.utils.toBN(totalSupply));
  await deployer.deploy(GDAODelegator,"Golff.finance DAO","GDAO", decimals, init, gdaoDelegateAddress, []);
  let gdaoAddress = GDAODelegator.address;
  
  // 3. Timelock
  await deployer.deploy(Timelock);
  let TimelockAddress = Timelock.address;

  // 4. GovernorAlpha
  await deployer.deploy(GovernorAlpha,TimelockAddress, gdaoAddress);
  let GovernorAlphaAddress = GovernorAlpha.address;

  // set
  let gdao = new web3.eth.Contract(GDAODelegator.abi, gdaoAddress);
  let gdaoTimelock = new web3.eth.Contract(Timelock.abi, TimelockAddress);
  let gdaoGovernorAlpha = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlphaAddress);
  await Promise.all([
    gdao.methods._setPendingGov(TimelockAddress).send({ from: deploy_account, gasPrice: gas_price, gas: 100000}, function(err, txId) {
      console.log("[gdao] _setPendingGov txid: "+txId);
    }),
    // address target, uint256 value, string memory signature, bytes memory data, uint256 eta
    gdaoTimelock.methods.executeTransaction(gdaoAddress, 0, "_acceptGov()", [], 0).send({ from: deploy_account, gasPrice: gas_price, gas: 100000}, function(err, txId) {
      console.log("[gdaoTimelock] executeTransaction txid: "+txId);
    }),
    
    gdaoTimelock.methods.setPendingAdmin(GovernorAlphaAddress).send({ from: deploy_account, gasPrice: gas_price, gas: 100000}, function(err, txId) {
      console.log("[gdaoTimelock] setPendingAdmin txid: "+txId);
    }),

    gdaoGovernorAlpha.methods.__acceptAdmin().send({ from: deploy_account, gasPrice: gas_price, gas: 100000}, function(err, txId) {
      console.log("[gdaoGovernorAlpha] __acceptAdmin txid: "+txId);
    }),
  ]);
  
}