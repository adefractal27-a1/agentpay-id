// Testnet rehearsal for AgentPayID - runs the full user flow end to end.
// Usage: node scripts/rehearse.js <mockAgentID address> <agentPayID address>
// Requires .env DEPLOYER_PRIVATE_KEY + TESTER_PRIVATE_KEY (local test wallets).
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";

async function main() {
  const [mockAddr, payAddr] = process.argv.slice(2);
  if (!mockAddr || !payAddr) throw new Error("usage: node scripts/rehearse.js <mock> <agentpay>");

  const provider = new ethers.JsonRpcProvider(RPC, 97);
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const tester = new ethers.Wallet(process.env.TESTER_PRIVATE_KEY, provider);
  const stranger = ethers.Wallet.createRandom().connect(provider); // no mock ID, no funds

  const load = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", n + ".json"), "utf8"));
  const mock = new ethers.Contract(mockAddr, load("MockAgentID").abi, deployer);
  const payD = new ethers.Contract(payAddr, load("AgentPayID").abi, deployer);
  const payT = new ethers.Contract(payAddr, load("AgentPayID").abi, tester);
  const payS = new ethers.Contract(payAddr, load("AgentPayID").abi, stranger);

  const out = [];
  const log = (k, v) => { out.push(k + ": " + v); console.log(k + ":", v); };

  // 1) Mint mock Agent IDs to deployer + tester
  let tx = await mock.mint(deployer.address); await tx.wait();
  log("mint->deployer tx", tx.hash);
  tx = await mock.mint(tester.address); await tx.wait();
  log("mint->tester tx", tx.hash);
  log("hasAgentID(deployer)", await payD.hasAgentID(deployer.address));
  log("hasAgentID(tester)", await payD.hasAgentID(tester.address));
  log("hasAgentID(stranger)", await payD.hasAgentID(stranger.address));

  // 2) Fund tester with gas money
  tx = await deployer.sendTransaction({ to: tester.address, value: ethers.parseEther("0.01") });
  await tx.wait();
  log("fund tester 0.01 tBNB tx", tx.hash);

  // 3) Check-ins (one per holder)
  tx = await payD.checkIn(); await tx.wait();
  log("checkIn deployer tx", tx.hash);
  tx = await payT.checkIn(); await tx.wait();
  log("checkIn tester tx", tx.hash);

  // 4) Payment deployer -> tester, 0.001 tBNB
  const before = await provider.getBalance(tester.address);
  tx = await payD.payBNB(tester.address, "testnet rehearsal", { value: ethers.parseEther("0.001") });
  await tx.wait();
  const after = await provider.getBalance(tester.address);
  log("payBNB 0.001 tx", tx.hash);
  log("tester received (tBNB)", ethers.formatEther(after - before));

  // 5) Negative proofs (simulated, no gas spent): must all revert
  const expectRevert = async (label, promise) => {
    try { await promise; log(label, "NO REVERT - PROBLEM"); }
    catch (e) { log(label, "reverted as expected (" + (e.shortMessage || e.message).slice(0, 80) + ")"); }
  };
  await expectRevert("stranger checkIn", payS.checkIn.staticCall());
  await expectRevert("deployer checkIn twice", payD.checkIn.staticCall());
  await expectRevert("payBNB to non-holder", payD.payBNB.staticCall(stranger.address, "x", { value: 1n }));

  // 6) Final state
  log("uniqueInteractors", (await payD.uniqueInteractors()).toString());
  log("totalCheckIns", (await payD.totalCheckIns()).toString());
  log("totalPayments", (await payD.totalPayments()).toString());
  log("totalBNBPaid (tBNB)", ethers.formatEther(await payD.totalBNBPaid()));
  const prof = await payD.profileOf(deployer.address);
  log("deployer profile", "holder=" + prof[0] + " checkIns=" + prof[1] + " streak=" + prof[2] + " points=" + prof[3]);
  log("contract BNB balance (must be 0)", ethers.formatEther(await provider.getBalance(payAddr)));
}

main().catch((e) => { console.error("REHEARSE FAILED:", e.message); process.exit(1); });
