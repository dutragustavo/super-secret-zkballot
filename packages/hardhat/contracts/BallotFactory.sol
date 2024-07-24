// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./Ballot.sol";
import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract BallotFactory {
    Ballot[] public ballots;
    ISemaphore public semaphore;

    event BallotCreated(address ballotAddress, uint256 groupId);

    constructor(ISemaphore _semaphore) {
        semaphore = _semaphore;
    }

    function createBallot(bytes32[] memory proposalNames) public returns (address) {
        Ballot newBallot = new Ballot(proposalNames, semaphore);
        ballots.push(newBallot);
        emit BallotCreated(address(newBallot), newBallot.groupId());

        return address(newBallot);
    }

    function getBallotCount() public view returns (uint) {
        return ballots.length;
    }

    function getBallotAddress(uint index) public view returns (address) {
        require(index < ballots.length, "Invalid index");
        
        return address(ballots[index]);
    }

    function getAllBallots() public view returns (Ballot[] memory) {
        return ballots;
    }    
}