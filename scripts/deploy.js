// Deploy AgentPayID. REQUIRES explicit owner approval before any mainnet run.
//
// Setup (never commit secrets):
//   cp .env.example .env   and fill DEPLOYER_PRIVATE_KEY locally
//   npm install && npm run compile
//
// Testnet (chainId 97): deploys MockAgentID first, then AgentPayID pointing
//   at the mock, so the whole flow can be tested without a real Agent ID.
//     node scripts/deploy.js testnet
// Mainnet (chainId 56): deploys AgentPayID pointing at the REAL SPACE ID
//   Agent ID registry from the Binance announcement.
//     node scripts/deploy.js mainnet
//
// After deploy: put the AgentPayID address into frontend/config.js,
// verify the source on BscScan (scripts/verify-guide.md), and record the
// address in SUBMISSION.md.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const REAL_AGENT_ID = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";
const NETWORKS = {
  testnet: { rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", chainId: 97 },
  mainnet: { rpc: "https://bsc-dataseed.binance.org", chainId: 56 },
};

async function main() {
  const netName = process.argv[2];
  if (!NETWORKS[netName]) throw new Error("usage: node scripts/deploy.js testnet|mainnet");
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY missing in .env");

  const net = NETWORKS[netName];
  const provider = new ethers.JsonRpcProvider(net.rpc, net.chainId);
  const wallet = new ethers.Wallet(pk, provider);
  const bal = await provider.getBalance(wallet.address);
  console.log("network:", netName, "chainId:", net.chainId);
  console.log("deployer:", wallet.address, "BNB:", ethers.formatEther(bal));
  if (bal === 0n) throw new Error("deployer has no BNB for gas");

  const load = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", n + ".json"), "utf8"));

  let registry = REAL_AGENT_ID;
  if (netName === "testnet") {
    const mock = load("MockAgentID");
    const Mock = new ethers.ContractFactory(mock.abi, mock.bytecode, wallet);
    const m = await Mock.deploy();
    await m.waitForDeployment();
    registry = await m.getAddress();
    console.log("MockAgentID (testnet only):", registry);
  }

  const art = load("AgentPayID");
  const Factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  const c = await Factory.deploy(registry, wallet.address);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log("AgentPayID deployed:", addr);
  console.log("registry used:", registry);
  console.log("NEXT: verify on BscScan, set frontend/config.js CONTRACT_ADDRESS =", addr);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
