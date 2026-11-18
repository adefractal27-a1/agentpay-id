// Compile both contracts with solc-js. No Hardhat needed.
// Usage: npm install && npm run compile
// Output: build/AgentPayID.json, build/MockAgentID.json (abi + bytecode)
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const root = path.join(__dirname, "..");
const sources = {};
for (const f of ["AgentPayID.sol", "MockAgentID.sol"]) {
  sources[f] = { content: fs.readFileSync(path.join(root, "contracts", f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const out = JSON.parse(solc.compile(JSON.stringify(input)));
let failed = false;
for (const e of out.errors || []) {
  console.log(e.severity.toUpperCase() + ": " + e.formattedMessage);
  if (e.severity === "error") failed = true;
}
if (failed) process.exit(1);

fs.mkdirSync(path.join(root, "build"), { recursive: true });
for (const file of Object.keys(out.contracts)) {
  for (const name of Object.keys(out.contracts[file])) {
    const c = out.contracts[file][name];
    if (!c.evm.bytecode.object) continue; // interfaces have no bytecode
    fs.writeFileSync(
      path.join(root, "build", name + ".json"),
      JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
    );
    console.log("compiled", name, "bytecode bytes:", c.evm.bytecode.object.length / 2);
  }
}
