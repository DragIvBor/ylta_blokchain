// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/GuessTheNumber.sol";

contract GuessTheNumberTest is Test {
    GuessTheNumber public game;
    address owner = address(0x1);
    address player = address(0x2);

    function setUp() public {
        vm.deal(owner, 10 ether);
        vm.deal(player, 10 ether);
        vm.prank(owner);
        game = new GuessTheNumber();
    }

    function testInitialPot() public {
        assertEq(game.getPot(), 0);
    }

    function testOwnerFundsPot() public {
        vm.prank(owner);
        game.fund{value: 1 ether}();
        assertEq(game.getPot(), 1 ether);
    }

    function testPlayerWins() public {
        vm.prank(owner);
        game.fund{value: 1 ether}();
        uint256 potBefore = game.getPot();
        vm.prank(player);
        game.guess{value: 0.001 ether}(2); // Любое число
        uint256 potAfter = game.getPot();
        assert(potAfter == potBefore + 0.001 ether || potAfter == potBefore - 0.001 ether);
    }
}
