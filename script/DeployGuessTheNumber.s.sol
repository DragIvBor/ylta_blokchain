// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/GuessTheNumber.sol";

contract DeployGuessTheNumber is Script {
    function run() external {
        vm.startBroadcast();
        new GuessTheNumber();
        vm.stopBroadcast();
    }
}
