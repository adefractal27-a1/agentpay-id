// Minimal ABIs - only the functions the frontend actually calls.
window.AGENTPAY_ABI = [
  "function hasAgentID(address account) view returns (bool)",
  "function profileOf(address account) view returns (bool isAgentIDHolder, uint64 checkIns, uint64 streak, uint256 reputationPoints, uint64 lastCheckInDay)",
  "function canCheckIn(address account) view returns (bool)",
  "function uniqueInteractors() view returns (uint256)",
  "function totalCheckIns() view returns (uint256)",
  "function totalPayments() view returns (uint256)",
  "function checkIn()",
  "function payBNB(address recipient, string memo) payable returns (bool)",
  "function payToken(address token, address recipient, uint256 amount, string memo) returns (bool)",
  "event CheckedIn(address indexed user, uint64 day, uint64 streak, uint256 reputationPoints)",
  "event PaymentSent(address indexed from, address indexed to, uint256 amountWei, string memo)",
];

window.ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

window.AGENT_ID_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];
