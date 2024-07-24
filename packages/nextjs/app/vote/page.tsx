"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { generateProof, Group, Identity } from "@semaphore-protocol/core"
// import { SemaphoreSubgraph } from "@semaphore-protocol/data"
import { useLogContext } from "../../context/LogContext";
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useReadBallotContract } from "~~/hooks/useReadBallotContract";
import { useWriteBallotContract } from "~~/hooks/useWriteBallotContract";
import { Address, Hex, hexToString } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface Proposal {
  name: string;
  voteCount: BigInt;
}

const Vote: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [ballotAddress] = useLocalStorage('ballotAddress', '');

  const {data: proposals} = useReadBallotContract({
    contractName: "Ballot",
    functionName: "getAllProposals",
    address: ballotAddress,
  });

  const { data: voterUser } = useReadBallotContract({
    functionName: "voters",
    address: ballotAddress,
    args: [connectedAddress],
  });

  const { data: groupId } = useReadBallotContract({
    address: ballotAddress,
    functionName: "groupId",
  });

  const { writeContractAsync: writeBallotAsync } = useWriteBallotContract(ballotAddress);

  return (
    <>
      <>
        <div className="flex flex-col items-center flex-grow pt-10">
          {/* User Joined, time to vote*/}
          {voterUser?.[0] && (
            <div>
              <p><strong>Proposals</strong><br /> {ballotAddress}</p>
              <div className="flex flex-wrap gap-5">
                {proposals?.map((proposal: any, i: number) => (
                  <div key={proposal} className="flex flex-col items-center">
                    <button
                      className="mt-2 btn btn-secondary"
                      onClick={async () => {
                        try {
                          // Uncomment this when we deploy to Sepolia. We'll recreate the group from the Ballot contract 
                          // to replicate the on-chain group off-chain. This is needed to generate the proofs.
                          // const semaphoreSubgraph = new SemaphoreSubgraph("sepolia")
                          // const { members } = await semaphoreSubgraph.getGroup(groupId?.toString() || "0", { members: true })
                          // const group = new Group(members);
                          
                          // Group of only one user, just for the local tests
                          const privKey = localStorage.getItem("identity");
                          const identity = new Identity(Buffer.from(privKey!, "base64"));
                          const group = new Group([identity.commitment]);
                          console.log(identity.commitment);
                          const proposalId = BigInt(i);
                          const { points, merkleTreeDepth, merkleTreeRoot, nullifier } = await generateProof(
                            identity, 
                            group, 
                            proposalId, 
                            Number(groupId)
                          );
                          await writeBallotAsync({ functionName: "vote", args: [
                            proposalId, 
                            {
                              merkleTreeDepth: BigInt(merkleTreeDepth),
                              merkleTreeRoot: merkleTreeRoot,
                              nullifier: nullifier,
                              message: proposalId,
                              scope: BigInt(groupId || 0n),
                              points: points,
                            }
                          ] });
                        } catch (err) {
                          console.error("Error joining the ballot");
                        }
                      }}
                    >
                      Vote for {hexToString(proposal.name as Hex, {size: 32})}
                    </button>

                    <span>{proposal.voteCount.toString()} votes</span>
                  </div>
                ))}
              </div>
            </div>
          )}




        </div>
      </>
    </>
  );
};

export default Vote;

