// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

/// @title Voting with delegation.a
contract Ballot {

    ISemaphore public semaphore;
    uint256 groupId;

    struct Voter {
        bool joined;
        uint vote;
    }

    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    mapping(address => Voter) public voters;

    Proposal[] public proposals;

    constructor(bytes32[] memory proposalNames, ISemaphore _semaphore) {
        semaphore = _semaphore;
        groupId = semaphore.createGroup();

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
        }
    }

    function vote(uint proposal, ISemaphore.SemaphoreProof calldata proof) external {
        Voter storage sender = voters[msg.sender];

        // This will validate the proof and revert if the proof was already used
        // which means that each user that joined can only vote once 
        semaphore.validateProof(groupId, proof);

        sender.vote = proposal;

        // If `proposal` is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        proposals[proposal].voteCount += 1;
    }

    /// @dev User joins the voting poll
    /// each user can only join and vote once.
    function joinBallot(uint256 identityCommitment) external {
        require(!voters[msg.sender].joined, "User already joined the ballot");
        semaphore.addMember(groupId, identityCommitment);
        voters[msg.sender].joined = true;
    }

    /// @dev Computes the winning proposal taking all
    /// previous votes into account.
    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the name of the winner
    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
