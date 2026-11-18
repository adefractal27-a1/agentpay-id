// AgentPay ID - frontend configuration
// Fill CONTRACT_ADDRESS after deployment (see scripts/deploy.js output),
// then redeploy this static folder. Nothing else needs to change.
window.AGENTPAY_CONFIG = {
  // Deployed 2026-11-18 via CREATE2 factory from the owner's Agentic Wallet.
  // Deploy tx: 0x990e405a3a084d71bf5bc7fae2252889e66340bd2b409876db8834c96b86d5c1
  CONTRACT_ADDRESS: "0x1f76A40f30F8Fa52431FAE63FDc1322836717B96",

  // SPACE ID Agent ID registry on BNB Chain (from the Binance announcement)
  AGENT_ID_CONTRACT: "0x60b9262456de011f7d15a54cdd8c48baaa8b022f",

  // BNB Smart Chain mainnet
  CHAIN_ID: 56,
  CHAIN_NAME: "BNB Smart Chain",
  RPC_URL: "https://bsc-dataseed.binance.org",
  EXPLORER: "https://bscscan.com",
};
