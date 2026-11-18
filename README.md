# AgentPay ID

**Verified payments + daily reputation check-in, exclusively for Binance Agent ID holders.**
Built for the Binance Wallet × BNB Chain **Agent ID Hackathon** (submission period 18 Nov – 9 Dec 2026, UTC).

- Website: _(to fill after hosting)_
- Contract (BNB Chain): _(to fill after deployment)_
- Agent ID registry (SPACE ID, from the official announcement): `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`

## The problem

Anyone can copy a profile name or a look-alike address. When an AI-agent wallet
pays "the right name" at the wrong address, the money is gone — transfers are
irreversible. Agent ID (`name.ai`, one per user, non-transferable) is a strong
identity primitive, but today almost nothing *uses* it at the moment of payment.

## What AgentPay ID does

Agent ID is the core of every flow, in three ways the announcement calls for
(access control, payments, identity):

1. **Access control** — Only Agent ID holders can check in or send a payment.
   The check is exactly the documented one: `balanceOf(address) > 0` on the
   Agent ID contract.
2. **Payments** — A payment can only go to an address that *also* holds an
   Agent ID. The dApp verifies the recipient on-chain before the send button
   is enabled, and the contract re-verifies inside the transaction. Paying an
   unverified look-alike through AgentPay ID is impossible by construction.
   - `payBNB` forwards the full amount to the recipient in the same
     transaction. No fee, no custody.
   - `payToken` moves the exact approved amount sender → recipient.
   - Receiving works through a **payment link the recipient creates for
     their own wallet and shares voluntarily** (`?to=<their address>`).
3. **Identity / reputation** — A daily check-in builds a public, non-transferable
   reputation score (streak + points) per Agent ID holder. Any other dApp can
   read `profileOf(address)` as a trust signal — e.g. "this agent identity has
   shown up 40 days in a row".

## What AgentPay ID deliberately does NOT do (hackathon red lines)

- **No looking up other people's wallets by name.** There is no name →
  address resolution and no directory, in the contract or the frontend.
- No QR-code / pairing-code login, no server-side sessions, no signing on a
  user's behalf. Every transaction is confirmed by the user in their wallet.
- No unauthorised or bundled transfers, no scheduled collection, and the
  frontend requests ERC-20 approval for the **exact** payment amount only.
- No collection of seed phrases, private keys, API secrets, or pairing codes.
- No promise of returns. Reputation points are not a token, are
  non-transferable, and have no monetary value.
- The project name and branding do not use "Binance" or "BNB".

## Owner permissions (disclosed as required)

The contract owner (deployer) can **only**:

- `pause()` / `unpause()` — stop *new* interactions with this contract in an
  emergency. This cannot freeze any wallet or user asset.
- `transferOwnership()` — hand the above to another address.

The owner **cannot** withdraw funds (no withdraw function exists; the
contract has no `receive()` and holds a 0 balance by design), cannot mint,
cannot set fees (there are none), and cannot move user assets.

## Repository layout

| Path | Contents |
| --- | --- |
| `contracts/AgentPayID.sol` | The product contract (single file, no external dependencies) |
| `contracts/MockAgentID.sol` | Testnet/local test double for the registry — **test only** |
| `frontend/` | Static dApp (ethers v6, injected wallet). Set `CONTRACT_ADDRESS` in `config.js` after deploy |
| `scripts/compile.js` | Compile with solc-js → `build/` |
| `scripts/deploy.js` | Deploy to BNB Chain Testnet (with mock) or Mainnet (real registry) |
| `scripts/verify-guide.md` | BscScan source-verification steps |
| `test/logic-test.js` | Static red-line audit + streak-logic tests (`npm test`) |
| `docs/` | Agent ID usage description & safety analysis (submission materials) |
| `SUBMISSION.md` | Ready-to-submit hackathon form contents |
| `PROMO-X.md` | Community promotion post draft |

## Run it

```bash
npm install
npm run compile   # -> build/AgentPayID.json
npm test          # static + logic audit
# testnet rehearsal (needs a funded testnet deployer key in .env):
node scripts/deploy.js testnet
# mainnet (only with explicit owner approval):
node scripts/deploy.js mainnet
```

Then set `CONTRACT_ADDRESS` in `frontend/config.js`, verify the contract on
BscScan, and serve the `frontend/` folder on any static host.

## Risk warning

Crypto transfers are irreversible. Always double-check the recipient address
in your wallet's confirmation screen. This is a hackathon product that has not
been third-party audited; use small amounts.
