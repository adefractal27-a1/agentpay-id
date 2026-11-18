// AgentPay ID frontend. Plain ethers v6, injected wallet only
// (Binance Wallet / MetaMask). No QR login, no pairing codes, no session
// storage on any server - the user confirms every transaction in-wallet.
(function () {
  const CFG = window.AGENTPAY_CONFIG;
  const $ = (id) => document.getElementById(id);
  let provider, signer, myAddress, contract, agentId;

  function msg(id, text) { $(id).textContent = text; }

  function readProvider() {
    return new ethers.JsonRpcProvider(CFG.RPC_URL);
  }

  function readContracts() {
    const rp = readProvider();
    return {
      contract: CFG.CONTRACT_ADDRESS
        ? new ethers.Contract(CFG.CONTRACT_ADDRESS, window.AGENTPAY_ABI, rp)
        : null,
      agentId: new ethers.Contract(CFG.AGENT_ID_CONTRACT, window.AGENT_ID_ABI, rp),
    };
  }

  async function loadStats() {
    try {
      const { contract: c } = readContracts();
      if (!c) { msg("statUnique", "contract not deployed yet"); return; }
      const [u, t, p] = await Promise.all([c.uniqueInteractors(), c.totalCheckIns(), c.totalPayments()]);
      $("statUnique").textContent = u.toString();
      $("statCheckIns").textContent = t.toString();
      $("statPayments").textContent = p.toString();
    } catch (e) { /* stats are best-effort */ }
  }

  async function refreshProfile() {
    if (!myAddress) return;
    const { agentId: reg } = readContracts();
    const bal = await reg.balanceOf(myAddress);
    const has = bal > 0n;
    $("agentStatus").textContent = has ? "Agent ID holder ✓" : "No Agent ID on this wallet";
    $("profileBox").hidden = !has;
    $("btnMyLink").disabled = !has;
    if (has && CFG.CONTRACT_ADDRESS) {
      const { contract: c } = readContracts();
      const p = await c.profileOf(myAddress);
      $("pCheckins").textContent = p.checkIns.toString();
      $("pStreak").textContent = p.streak.toString();
      $("pPoints").textContent = p.reputationPoints.toString();
      const can = await c.canCheckIn(myAddress);
      $("btnCheckIn").disabled = !can;
      msg("checkInMsg", can ? "" : "Already checked in today (UTC).");
    }
  }

  $("btnConnect").onclick = async () => {
    if (!window.ethereum) { alert("No wallet found. Open this page in Binance Wallet or a wallet browser."); return; }
    provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CFG.CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + CFG.CHAIN_ID.toString(16) }],
      });
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    signer = await provider.getSigner();
    myAddress = await signer.getAddress();
    $("walletLine").textContent = "Connected: " + myAddress;
    if (CFG.CONTRACT_ADDRESS) {
      contract = new ethers.Contract(CFG.CONTRACT_ADDRESS, window.AGENTPAY_ABI, signer);
    }
    // If the visitor arrived from someone's payment link, prefill recipient.
    const q = new URLSearchParams(location.search);
    if (q.get("to")) $("payTo").value = q.get("to");
    await refreshProfile();
    await loadStats();
  };

  $("btnCheckIn").onclick = async () => {
    if (!contract) { msg("checkInMsg", "Contract not deployed yet."); return; }
    try {
      const tx = await contract.checkIn();
      msg("checkInMsg", "Confirm in your wallet… waiting for the transaction.");
      await tx.wait();
      msg("checkInMsg", "Checked in ✓");
      await refreshProfile(); await loadStats();
    } catch (e) { msg("checkInMsg", "Failed: " + (e.shortMessage || e.message)); }
  };

  $("btnMyLink").onclick = () => {
    if (!myAddress) return;
    // Own address only - the link is for the connected wallet itself.
    $("myLink").value = location.origin + location.pathname + "?to=" + myAddress;
    $("myLink").select();
  };

  let recipientVerified = false;
  $("btnVerifyRecipient").onclick = async () => {
    recipientVerified = false; $("btnPay").disabled = true;
    const to = $("payTo").value.trim();
    if (!ethers.isAddress(to)) { msg("recipientMsg", "That is not a valid address."); return; }
    const { agentId: reg } = readContracts();
    const bal = await reg.balanceOf(to);
    if (bal > 0n) {
      recipientVerified = true; $("btnPay").disabled = false;
      msg("recipientMsg", "Verified: this address holds an Agent ID ✓");
    } else {
      msg("recipientMsg", "This address does NOT hold an Agent ID. Payment is blocked by design.");
    }
  };

  $("btnPay").onclick = async () => {
    if (!contract || !recipientVerified) return;
    const to = $("payTo").value.trim();
    const amount = $("payAmount").value;
    const memo = $("payMemo").value || "";
    try {
      const value = ethers.parseEther(String(amount));
      // Final re-check on-chain right before sending.
      if (!(await contract.hasAgentID(to))) { msg("payMsg", "Recipient no longer verified. Payment cancelled."); return; }
      const tx = await contract.payBNB(to, memo, { value });
      msg("payMsg", "Confirm in your wallet… waiting for the transaction.");
      const r = await tx.wait();
      msg("payMsg", "Paid ✓ Tx: " + r.hash);
      await loadStats();
    } catch (e) { msg("payMsg", "Failed: " + (e.shortMessage || e.message)); }
  };

  loadStats();
})();
