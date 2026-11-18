# Hackathon submission — READY TO FILL (submit before 9 Dec 2026, 08:00 UTC / 15:00 WIB)

Official announcement: https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf
**Official submission form (given by Bos 2026-11-18, inspected read-only the
same day): https://www.binance.com/en/survey/fb26d2bd25e04329b1ba77c7b3811d23**
Submission period: 2026-11-18 08:00 UTC → 2026-12-09 08:00 UTC.
No separate registration — submit through the form above.

## The form itself (page 1 inspected 2026-11-18; form is paginated, ~14% = page 1)

Section I. Basic Project Information — all 5 fields REQUIRED, all free-text:

1. **Project Name** → ready: `AgentPay ID`
2. **Project Overview** (help text: 1–3 sentences, core functions + main
   problem solved) → ready draft:
   "AgentPay ID lets Binance Agent ID holders pay and build reputation
   safely: its BNB Chain contract only allows payments between addresses
   verified on-chain as Agent ID holders, so value cannot be sent to an
   unverified look-alike address. It solves the irreversible-payment identity
   problem for agent wallets, and adds a daily check-in that turns an Agent
   ID into public, non-transferable reputation other dApps can read."
3. **Project Contract Address(es)** (help text: submit the BscScan link;
   source must be verified + open-sourced on BscScan) → PENDING deploy:
   format `https://bscscan.com/address/<ADDRESS>#code`
4. **Project Website / Product Access Link** → DIPUTUSKAN Bos 2026-11-18:
   **`https://agentpay.primadigital.web.id`** (subdomain dari domain Bos sendiri).
   Catatan teknis: zona primadigital.web.id di Cloudflare punya wildcard
   `*.primadigital.web.id` yang mengarah ke tunnel gateway Tencent — jadi
   subdomain ini perlu record DNS khusus + hosting statis sendiri (rencana:
   Cloudflare Pages, gratis) agar tidak menabrak situs gateway. PENDING hosting (ACC-3).
5. **Project Social Media Link (X)** → READY (akun ditunjuk Bos 2026-11-18,
   terverifikasi dari tab X yang login di browser Bos):
   `https://x.com/DewaRucie4` (@DewaRucie4, nama tampil "Dewa Rucie")

Pages 2+ could NOT be inspected without filling page 1 (Next is blocked by
validation). They will be inventoried during the real submission, page by
page, before anything is finally submitted. Nothing has been filled or
submitted yet.

## Fields

- **Project name:** AgentPay ID
- **Website:** https://agentpay.primadigital.web.id — LIVE 2026-11-18 20:13 WIB
  (Cloudflare Pages, project agentpay → agentpay-2w1.pages.dev, custom domain
  Active + SSL). Vision-verified by Muse from the live URL: page renders,
  Community card shows live mainnet data (interacted 1 · check-ins 1 ·
  payments 0). NOTE: the first Worker-based upload served octet-stream
  (download bug) — deleted; Pages ZIP upload is the working route.
- **Contract address(es) (BNB Chain):** AgentPayID `0x1f76A40f30F8Fa52431FAE63FDc1322836717B96`
  - BscScan: https://bscscan.com/address/0x1f76A40f30F8Fa52431FAE63FDc1322836717B96
  - Deployed 2026-11-18 from the owner's Agentic Wallet (0x3b7Db254A427e834c948C6E4150c17D54B05a03A) via the public CREATE2 factory; deploy tx `0x990e405a3a084d71bf5bc7fae2252889e66340bd2b409876db8834c96b86d5c1`, block 134312259, gasUsed 944053. On-chain verified: owner() = owner's Agentic Wallet, agentIDRegistry() = real registry, hasAgentID(owner) = true.
  - Source verification on BscScan: PENDING (submit flattened AgentPayID.sol, solc v0.8.24, optimizer 200, constructor args = registry + owner).
  - AgentPayID: `...`
  - (The Agent ID registry we build on: `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`)
- **Reward receiving address:** _(PENDING — Bos to confirm: deployer wallet?)_
- **Open-source repo:** _(PENDING — publish this folder to a public GitHub repo)_
- **BscScan verified:** _(PENDING — link after verification)_

- **Agent ID usage description** (full version: docs/AGENT-ID-USAGE.md):

> AgentPay ID is a verified-payment and reputation dApp whose core flows are
> gated by Binance Agent ID. The contract calls balanceOf(address) on the
> SPACE ID Agent ID registry (0x60b9262456de011f7d15a54cdd8c48baaa8b022f):
> (1) access control — only Agent ID holders can check in or send payments;
> (2) payment safety — payments revert unless the recipient also holds an
> Agent ID, so value can only move to a verified agent identity; recipients
> share a payment link generated for their own wallet (there is deliberately
> no name-to-address lookup); (3) identity — a daily check-in builds a public
> non-transferable reputation score per Agent ID holder, readable by other
> dApps via profileOf(). The contract holds no user funds, charges no fee,
> and its owner can only pause new interactions with the contract itself.

- **How users interact (for the Growth metric):** Connect Binance Wallet →
  verify Agent ID → Daily Check-in (1 tx/day) and/or send a verified payment.
  The contract exposes `uniqueInteractors` — the count of distinct Agent ID
  holders who interacted — which is also the ≥30 threshold for the
  Innovation Award.

## Checklist before pressing submit

- [ ] ACC-3 from Bos for mainnet deploy (explicit "acc eksekusi")
- [ ] Bos has claimed his own Agent ID in the Binance App (Wallet → banner → Agent ID)
- [ ] Deployer wallet funded with a small amount of BNB for gas
- [ ] Testnet rehearsal passed (deploy testnet → mock mint → check-in → pay)
- [ ] Mainnet deploy done, address recorded above + in frontend/config.js
- [ ] BscScan verification = Success (scripts/verify-guide.md)
- [ ] Frontend hosted on a public URL, CONTRACT_ADDRESS set, screenshot taken
- [ ] Repo made public
- [ ] ≥30 Agent ID holders interacted (Innovation eligibility) — drive via PROMO-X.md + community channels
- [ ] Submission sent before 9 Dec 2026 15:00 WIB; screenshot of confirmation saved
