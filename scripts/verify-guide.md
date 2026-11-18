# BscScan verification guide (after deployment)

1. Open the deployed contract on https://bscscan.com (testnet: https://testnet.bscscan.com).
2. Contract tab → "Verify and Publish".
3. Compiler type: Single file. Compiler version: `v0.8.24`. License: MIT.
4. Optimization: **Yes, 200 runs** (matches scripts/compile.js).
5. Paste the full contents of `contracts/AgentPayID.sol`.
6. Constructor argument (mainnet): the Agent ID registry address
   `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`
   (ABI-encode as a single address; BscScan accepts the plain address in the
   constructor-arguments field for a single address parameter).
   Testnet: use the MockAgentID address printed by the deploy script.
7. Submit, wait for "Success", confirm the green check + source is readable.
8. Record the contract URL in SUBMISSION.md and README.md.

The code is also public in this repository (open-source requirement).
