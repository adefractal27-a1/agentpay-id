// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title AgentPay ID
 * @notice Verified payments + daily reputation check-in, gated by Binance
 *         Agent ID (SPACE ID Agent ID, ERC-721, BNB Chain).
 *
 * @dev Agent ID usage (core of this product, not a cosmetic gate):
 *      1. Access control  - only Agent ID holders can check in or send a payment.
 *      2. Payment safety  - a payment can only be sent to an address that holds
 *                           an Agent ID, so a payer cannot be tricked into paying
 *                           an unverified look-alike address through this dApp.
 *      3. Identity        - reputation (check-in streak + points) is accumulated
 *                           per Agent ID holder address and is publicly readable
 *                           by other dApps as a trust signal.
 *
 *      Compliance notes (Binance Agent ID Hackathon safety red lines):
 *      - This contract NEVER looks up "another person's wallet by name".
 *        There is no name -> address resolution and no directory in this
 *        contract. A recipient shares their OWN payment link voluntarily;
 *        the contract only checks balanceOf() for an address the payer
 *        already has.
 *      - No QR-code / pairing-code login, no session storage, no attempt to
 *        bypass wallet confirmation: every asset movement is a normal
 *        transaction the user sees and confirms in their own wallet.
 *      - No unauthorised transfers: payBNB forwards exactly msg.value to the
 *        named recipient in the same transaction; payToken moves exactly the
 *        stated amount from the sender (who approved that exact amount) to
 *        the named recipient. Nothing is collected, bundled, or redirected.
 *      - The contract holds NO user funds. It has no receive()/fallback(), so
 *        plain transfers to it revert, and its balance stays 0 by design.
 *      - Owner permissions (disclosed, see README "Owner permissions"):
 *        the owner can only pause/unpause new interactions with THIS contract
 *        and transfer ownership. The owner cannot withdraw funds (there is no
 *        withdraw function), cannot mint, cannot change fees (there are none),
 *        cannot freeze any wallet, and cannot touch user assets.
 *      - Reputation points are a non-transferable on-chain score only. They
 *        are not a token, have no monetary value, and promise no return.
 */

interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract AgentPayID {
    // ------------------------------------------------------------- state
    IAgentID public immutable agentIDRegistry;
    address public owner;
    bool public paused;

    struct Profile {
        uint64 totalCheckIns;
        uint64 currentStreak;
        uint64 lastCheckInDay; // UTC day number, type(uint64).max = never
        uint256 reputationPoints;
        bool countedAsInteractor;
    }

    mapping(address => Profile) private _profiles;

    /// @notice Number of distinct Agent ID holder addresses that have signed
    ///         an interaction (check-in or payment) with this contract.
    uint256 public uniqueInteractors;

    /// @notice Lifetime counters, readable by anyone.
    uint256 public totalCheckIns;
    uint256 public totalPayments;
    uint256 public totalBNBPaid; // in wei, sum of payBNB amounts

    // ------------------------------------------------------------- events
    event CheckedIn(address indexed user, uint64 day, uint64 streak, uint256 reputationPoints);
    event PaymentSent(address indexed from, address indexed to, uint256 amountWei, string memo);
    event TokenPaymentSent(address indexed from, address indexed to, address indexed token, uint256 amount, string memo);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ------------------------------------------------------------- errors
    error NotAgentIDHolder(address account);
    error RecipientNotAgentIDHolder(address recipient);
    error AlreadyCheckedInToday();
    error ZeroRecipient();
    error ZeroAmount();
    error SelfPayment();
    error TransferFailed();
    error ContractPaused();
    error NotOwner();
    error ZeroAddress();

    // ------------------------------------------------------------- guards
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyAgent() {
        if (!hasAgentID(msg.sender)) revert NotAgentIDHolder(msg.sender);
        _;
    }

    constructor(address agentIDRegistry_, address owner_) {
        if (agentIDRegistry_ == address(0)) revert ZeroAddress();
        if (owner_ == address(0)) revert ZeroAddress();
        agentIDRegistry = IAgentID(agentIDRegistry_);
        // Owner is set explicitly at birth, NOT taken from msg.sender, so the
        // contract can be deployed through a factory/forwarder and still be
        // owned from the first second by the intended owner wallet (the
        // project owner's Agentic Wallet). No separate ownership-transfer
        // transaction is needed after deployment.
        owner = owner_;
    }

    // No receive() / fallback(): plain BNB transfers to this contract revert.
    // The contract is designed to never hold funds.

    // ------------------------------------------------------------- views
    /// @notice The one check defined by the Binance announcement:
    ///         balanceOf(address) > 0 on the Agent ID contract.
    function hasAgentID(address account) public view returns (bool) {
        return agentIDRegistry.balanceOf(account) > 0;
    }

    function profileOf(address account)
        external
        view
        returns (
            bool isAgentIDHolder,
            uint64 checkIns,
            uint64 streak,
            uint256 reputationPoints,
            uint64 lastCheckInDay
        )
    {
        Profile storage p = _profiles[account];
        return (
            hasAgentID(account),
            p.totalCheckIns,
            p.currentStreak,
            p.reputationPoints,
            p.lastCheckInDay
        );
    }

    /// @notice UTC day number used for the once-per-day check-in rule.
    function today() public view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    function canCheckIn(address account) external view returns (bool) {
        return hasAgentID(account) && _profiles[account].lastCheckInDay != today();
    }

    // ------------------------------------------------------------- core
    /**
     * @notice Daily reputation check-in. Agent ID holders only, once per UTC day.
     * @dev Points: 10 base + streak bonus of 1 per streak day, capped at +7.
     *      Points are reputation only - not a token, no monetary value.
     */
    function checkIn() external whenNotPaused onlyAgent {
        Profile storage p = _profiles[msg.sender];
        uint64 day = today();
        if (p.lastCheckInDay == day) revert AlreadyCheckedInToday();

        if (p.totalCheckIns > 0 && p.lastCheckInDay == day - 1) {
            p.currentStreak += 1;
        } else {
            p.currentStreak = 1;
        }
        p.lastCheckInDay = day;
        p.totalCheckIns += 1;

        uint256 bonus = p.currentStreak > 7 ? 7 : p.currentStreak;
        p.reputationPoints += 10 + bonus;

        totalCheckIns += 1;
        _countInteractor(p);

        emit CheckedIn(msg.sender, day, p.currentStreak, p.reputationPoints);
    }

    /**
     * @notice Pay BNB to a verified Agent ID holder.
     * @dev The full msg.value is forwarded to `recipient` in this same
     *      transaction. The contract keeps nothing and charges no fee.
     *      The sender sees and confirms amount + recipient in their wallet.
     */
    function payBNB(address recipient, string calldata memo)
        external
        payable
        whenNotPaused
        onlyAgent
        returns (bool)
    {
        if (recipient == address(0)) revert ZeroRecipient();
        if (recipient == msg.sender) revert SelfPayment();
        if (msg.value == 0) revert ZeroAmount();
        if (!hasAgentID(recipient)) revert RecipientNotAgentIDHolder(recipient);

        _countInteractor(_profiles[msg.sender]);
        totalPayments += 1;
        totalBNBPaid += msg.value;

        (bool ok, ) = recipient.call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit PaymentSent(msg.sender, recipient, msg.value, memo);
        return true;
    }

    /**
     * @notice Pay an ERC-20 token to a verified Agent ID holder.
     * @dev Moves exactly `amount` from msg.sender to `recipient` via
     *      transferFrom. The frontend requests an approval for the exact
     *      amount only - never an unlimited approval. The contract never
     *      takes custody of the tokens.
     */
    function payToken(address token, address recipient, uint256 amount, string calldata memo)
        external
        whenNotPaused
        onlyAgent
        returns (bool)
    {
        if (token == address(0)) revert ZeroAddress();
        if (recipient == address(0)) revert ZeroRecipient();
        if (recipient == msg.sender) revert SelfPayment();
        if (amount == 0) revert ZeroAmount();
        if (!hasAgentID(recipient)) revert RecipientNotAgentIDHolder(recipient);

        _countInteractor(_profiles[msg.sender]);
        totalPayments += 1;

        bool ok = IERC20(token).transferFrom(msg.sender, recipient, amount);
        if (!ok) revert TransferFailed();

        emit TokenPaymentSent(msg.sender, recipient, token, amount, memo);
        return true;
    }

    // ------------------------------------------------------------- owner
    /// @notice Emergency stop for NEW interactions with this contract only.
    ///         Does not and cannot freeze any user's wallet or assets.
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ------------------------------------------------------------- internal
    function _countInteractor(Profile storage p) internal {
        if (!p.countedAsInteractor) {
            p.countedAsInteractor = true;
            uniqueInteractors += 1;
        }
    }
}
