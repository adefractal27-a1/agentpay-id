// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MockAgentID (TEST ONLY)
 * @notice Minimal stand-in for the SPACE ID Agent ID registry, used ONLY on
 *         BNB Chain Testnet and local tests, where the real registry
 *         (0x60b9262456de011f7d15a54cdd8c48baaa8b022f, mainnet) is not the
 *         contract under test. Never deploy this on mainnet as a registry.
 * @dev Implements only balanceOf() - the single function AgentPayID uses -
 *      plus a test mint so test wallets can become "Agent ID holders".
 */
contract MockAgentID {
    mapping(address => uint256) private _balances;

    event MockMinted(address indexed account);

    function mint(address account) external {
        require(_balances[account] == 0, "already holds mock ID");
        _balances[account] = 1;
        emit MockMinted(account);
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }
}
