import { expect } from "chai";
import { toHex, hexToString } from "viem";
import { viem, run } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// import { Group, Identity, generateProof } from "@semaphore-protocol/core"

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

async function deployContract() {
  const { semaphore } = await run("deploy:semaphore", {
    logs: false,
  });
  const semaphoreAddress = await semaphore.getAddress();
  const publicClient = await viem.getPublicClient();
  const [deployer, otherAccount] = await viem.getWalletClients();

  const ballotContract = await viem.deployContract("Ballot", [
    PROPOSALS.map(prop => toHex(prop, { size: 32 })),
    semaphoreAddress,
  ]);
  return { publicClient, deployer, otherAccount, ballotContract };
}

describe("Ballot", async () => {
  describe("when the contract is deployed", async () => {
    it("has the provided proposals", async () => {
      const { ballotContract } = await loadFixture(deployContract);
      for (let i = 0; i < PROPOSALS.length; i++) {
        const proposalsFromContract = await ballotContract.read.proposals([BigInt(i)]);
        const proposal = hexToString(proposalsFromContract[0], { size: 32 });
        expect(PROPOSALS[i]).to.equal(proposal);
      }
    });

    it("has zero votes for all proposals", async () => {
      const { ballotContract } = await loadFixture(deployContract);
      for (let i = 0; i < PROPOSALS.length; i++) {
        const proposal = await ballotContract.read.proposals([BigInt(i)]);
        expect(proposal[1]).to.eq(0n);
      }
    });
    it("sets the deployer address as chairperson", async () => {
      const { ballotContract, deployer } = await loadFixture(deployContract);
      const chairperson = await ballotContract.read.chairperson();
      expect(chairperson.toLowerCase()).to.eq(deployer.account.address);
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", async () => {
    it("gives right to vote for another address", async () => {
      const { publicClient, ballotContract, otherAccount } = await loadFixture(deployContract);
      // by default the chairperson is sending the tx, since they're the deployer
      const tx = await ballotContract.write.giveRightToVote([otherAccount.account.address]);
      const receipt = await publicClient.getTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal("success");

      const otherVoter = await ballotContract.read.voters([otherAccount.account.address]);
      expect(otherVoter[0]).to.eq(1n);
    });
    it("can not give right to vote for someone that has voted", async () => {
      const { publicClient, ballotContract, otherAccount } = await loadFixture(deployContract);
      let tx = await ballotContract.write.giveRightToVote([otherAccount.account.address]);
      const receipt = await publicClient.getTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal("success");

      const ballotContractAsVoter = await viem.getContractAt("Ballot", ballotContract.address, {
        client: { wallet: otherAccount },
      });
      tx = await ballotContractAsVoter.write.vote([0n]);

      await expect(ballotContract.write.giveRightToVote([otherAccount.account.address])).to.be.rejectedWith(
        "The voter already voted.",
      );
    });
    it("can not give right to vote for someone that has already voting rights", async () => {
      const { publicClient, ballotContract, otherAccount } = await loadFixture(deployContract);
      const tx = await ballotContract.write.giveRightToVote([otherAccount.account.address]);
      const receipt = await publicClient.getTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal("success");

      await expect(ballotContract.write.giveRightToVote([otherAccount.account.address])).to.be.rejectedWith("");
    });
  });

  describe("when the voter interacts with the vote function in the contract", async () => {
    it("should register the vote", async () => {
      const { publicClient, ballotContract } = await loadFixture(deployContract);
      const tx = await ballotContract.write.vote([0n]);
      const receipt = await publicClient.getTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal("success");

      const voteCount = await ballotContract.read.proposals([0n]);
      expect(voteCount[1]).to.eq(1n);
    });
  });

  describe("when the voter interacts with the delegate function in the contract", async () => {
    it("should transfer voting power", async () => {
      const { publicClient, ballotContract, deployer, otherAccount } = await loadFixture(deployContract);
      let tx = await ballotContract.write.giveRightToVote([otherAccount.account.address]);
      let receipt = await publicClient.getTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal("success");

      const senderVotingPower = await ballotContract.read.voters([deployer.account.address]);
      const delegateVotingPower = await ballotContract.read.voters([otherAccount.account.address]);

      tx = await ballotContract.write.delegate([otherAccount.account.address]);
      receipt = await publicClient.getTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal("success");

      const newVotingPower = await ballotContract.read.voters([otherAccount.account.address]);
      expect(newVotingPower[0]).to.eq(senderVotingPower[0] + delegateVotingPower[0]);
    });
  });

  describe("when an account other than the chairperson interacts with the giveRightToVote function in the contract", async () => {
    it("should revert", async () => {
      const { ballotContract, otherAccount } = await loadFixture(deployContract);

      const contractAsOtherAccount = await viem.getContractAt("Ballot", ballotContract.address, {
        client: { wallet: otherAccount },
      });

      await expect(contractAsOtherAccount.write.giveRightToVote([otherAccount.account.address])).to.be.rejectedWith("");
    });
  });

  describe("when an account without right to vote interacts with the vote function in the contract", async () => {
    it("should revert", async () => {
      const { ballotContract, otherAccount } = await loadFixture(deployContract);

      const contractAsOtherAccount = await viem.getContractAt("Ballot", ballotContract.address, {
        client: { wallet: otherAccount },
      });

      await expect(contractAsOtherAccount.write.vote([1n])).to.be.rejectedWith("Has no right to vote");
    });
  });

  describe("when an account without right to vote interacts with the delegate function in the contract", async () => {
    it("should revert", async () => {
      const { ballotContract, otherAccount, deployer } = await loadFixture(deployContract);

      const contractAsOtherAccount = await viem.getContractAt("Ballot", ballotContract.address, {
        client: { wallet: otherAccount },
      });

      await expect(contractAsOtherAccount.write.delegate([deployer.account.address])).to.be.rejectedWith(
        "You have no right to vote",
      );
    });
  });

  describe("when someone interacts with the winningProposal function before any votes are cast", async () => {
    it("should return 0", async () => {
      const { ballotContract } = await loadFixture(deployContract);
      const winningProposal = await ballotContract.read.winningProposal();
      expect(winningProposal).to.eq(0n);
    });
  });

  describe("when someone interacts with the winningProposal function after one vote is cast for the first proposal", async () => {
    it("should return 0", async () => {
      throw Error("Not implemented");
    });
  });

  describe("when someone interacts with the winnerName function before any votes are cast", async () => {
    // TODO
    it("should return name of proposal 0", async () => {
      throw Error("Not implemented");
    });
  });

  describe("when someone interacts with the winnerName function after one vote is cast for the first proposal", async () => {
    // TODO
    it("should return name of proposal 0", async () => {
      throw Error("Not implemented");
    });
  });

  describe("when someone interacts with the winningProposal function and winnerName after 5 random votes are cast for the proposals", async () => {
    // TODO
    it("should return the name of the winner proposal", async () => {
      throw Error("Not implemented");
    });
  });
});
