// Prepare CREATE2 deployment payloads for deployment FROM the owner's
// Agentic Wallet via baw contract-call (Developer Mode), through the public
// deterministic deployment proxy 0x4e59b44847b379578588920cA78FbF26c0B4956C
// (present on BSC mainnet + testnet). The Agentic Wallet calls the factory;
// the factory creates the contract; AgentPayID's owner is set explicitly in
// its constructor to the owner's wallet, so ownership is correct from birth.
//
// Usage: node scripts/prepare-deploy.js testnet|mainnet <ownerAddress>
// Writes build/deploy-<network>.json with { to, inputData, predictedAddress }
// per contract. Testnet deploys MockAgentID first, then AgentPayID pointing
// at the predicted mock address. Mainnet points at the real Agent ID registry.
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const FACTORY = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const REAL_AGENT_ID = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";

function create2Payload(saltLabel, initCode) {
  const salt = ethers.keccak256(ethers.toUtf8Bytes(saltLabel));
  const predicted = ethers.getCreate2Address(FACTORY, salt, ethers.keccak256(initCode));
  return { to: FACTORY, salt, inputData: salt + initCode.slice(2), predictedAddress: predicted };
}

function main() {
  const [net, owner] = process.argv.slice(2);
  if (!["testnet", "mainnet"].includes(net) || !owner) {
    throw new Error("usage: node scripts/prepare-deploy.js testnet|mainnet <ownerAddress>");
  }
  const load = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", n + ".json"), "utf8"));
  const out = { network: net, owner, factory: FACTORY };

  let registry = REAL_AGENT_ID;
  if (net === "testnet") {
    const mockInit = load("MockAgentID").bytecode;
    out.mock = create2Payload("agentpay-mock-testnet-v1", mockInit);
    registry = out.mock.predictedAddress;
  }

  const payArt = load("AgentPayID");
  const payInit = "0x" + payArt.bytecode.replace(/^0x/, "") + ethers.AbiCoder.defaultAbiCoder()
    .encode(["address", "address"], [registry, owner]).slice(2);
  out.agentpay = create2Payload("agentpay-" + net + "-v1", payInit);
  out.agentpay.registry = registry;

  const file = path.join(__dirname, "..", "build", "deploy-" + net + ".json");
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  if (out.mock) console.log("MockAgentID predicted:", out.mock.predictedAddress, "| inputData bytes:", (out.mock.inputData.length - 2) / 2);
  console.log("AgentPayID predicted:", out.agentpay.predictedAddress, "| inputData bytes:", (out.agentpay.inputData.length - 2) / 2);
  console.log("registry:", registry, "| owner:", owner, "| saved:", file);
}

main();
