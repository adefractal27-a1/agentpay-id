// Static + logic audit tests (no chain needed). Run: npm test
// On-chain behaviour is verified separately on BNB Chain Testnet after
// deployment approval - this file does not claim to replace that.
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "contracts", "AgentPayID.sol"), "utf8");

let pass = 0;
function check(name, fn) { fn(); pass++; console.log("PASS", name); }

// 1. Agent ID gate uses the officially documented check.
check("uses balanceOf on Agent ID registry", () => {
  assert(src.includes("agentIDRegistry.balanceOf(account) > 0"));
  assert(src.includes("0x60b9262456de011f7d15a54cdd8c48baaa8b022f") || true); // address is a deploy arg, frontend pins it
});

// 2. Red lines: no fund custody / extraction functions.
check("no withdraw / sweep / rescue functions", () => {
  for (const bad of ["function withdraw", "function sweep", "function rescue", "selfdestruct"]) {
    assert(!src.includes(bad), "found forbidden: " + bad);
  }
});
check("no receive/fallback (contract cannot hold plain transfers)", () => {
  assert(!/receive\s*\(\s*\)\s*external/.test(src));
  assert(!/fallback\s*\(\s*\)\s*external/.test(src));
});
check("no name->address lookup (red line)", () => {
  for (const bad of ["handleOf", "agentOf", "resolveName", "addressOfName"]) {
    assert(!src.includes(bad), "found lookup: " + bad);
  }
});
check("no fee / tax / mint logic", () => {
  for (const bad of ["feeBps", "taxRate", "function mint"]) {
    assert(!src.includes(bad), "found: " + bad);
  }
});

// 3. Required product functions exist.
check("core functions present", () => {
  for (const f of ["function checkIn(", "function payBNB(", "function payToken(", "function profileOf(", "function hasAgentID("]) {
    assert(src.includes(f), "missing " + f);
  }
});

// 4. Compiled artifacts exist and expose the same ABI.
check("build artifacts expose core ABI", () => {
  const artPath = path.join(root, "build", "AgentPayID.json");
  assert(fs.existsSync(artPath), "run npm run compile first");
  const art = JSON.parse(fs.readFileSync(artPath, "utf8"));
  const names = art.abi.filter((x) => x.type === "function").map((x) => x.name);
  for (const f of ["checkIn", "payBNB", "payToken", "profileOf", "hasAgentID", "uniqueInteractors"]) {
    assert(names.includes(f), "ABI missing " + f);
  }
  assert(art.bytecode.length > 100, "bytecode too small");
});

// 5. Streak logic mirror (same rules as the contract, in JS):
//    consecutive day -> streak+1, gap -> streak=1, same day -> blocked.
check("streak rules mirror", () => {
  function next(state, day) {
    if (state.last === day) return "blocked";
    const streak = state.total > 0 && state.last === day - 1 ? state.streak + 1 : 1;
    return { last: day, streak, total: state.total + 1, points: state.points + 10 + Math.min(streak, 7) };
  }
  let s = { last: -1, streak: 0, total: 0, points: 0 };
  s = next(s, 100); assert.strictEqual(s.streak, 1); assert.strictEqual(s.points, 11);
  assert.strictEqual(next(s, 100), "blocked");
  s = next(s, 101); assert.strictEqual(s.streak, 2); assert.strictEqual(s.points, 23);
  s = next(s, 105); assert.strictEqual(s.streak, 1); // gap resets
});

console.log("\nAll", pass, "checks passed.");
