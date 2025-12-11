// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract GuessTheNumber {
    address public owner;
    uint256 public totalPot;
    uint256 private seed;

    event NewGuess(address indexed player, uint256 guess, bool won, uint256 reward);
    event Funded(address indexed funder, uint256 amount);
    event Withdrew(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
        totalPot = 0;
        seed = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.difficulty, msg.sender)
            )
        );
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function fund() external payable onlyOwner {
        require(msg.value > 0, "Must send more than 0 ETH");
        totalPot += msg.value;
        emit Funded(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(totalPot >= amount, "Not enough funds in pot");
        totalPot -= amount;
        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Transfer failed");
        emit Withdrew(msg.sender, amount);
    }

    function guess(uint256 number) external payable returns (bool) {
        require(msg.value == 0.001 ether, "Bet must be 0.01 ETH");
        require(number >= 1 && number <= 5, "Guess must be between 1 and 5");

        uint256 random = (seed % 5) + 1;
        seed = uint256(keccak256(abi.encodePacked(seed, block.timestamp)));

        if (number == random) {
            uint256 reward = msg.value * 2;
            require(totalPot >= reward, "Not enough funds in pot to pay reward");
            (bool sent, ) = msg.sender.call{value: reward}("");
            require(sent, "Transfer failed");
            totalPot -= reward;
            emit NewGuess(msg.sender, number, true, reward);
            return true;
        } else {
            totalPot += msg.value;
            emit NewGuess(msg.sender, number, false, 0);
            return false;
        }
    }

    function getPot() external view returns (uint256) {
        return totalPot;
    }
}
