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
  const { setLog } = useLogContext()
  const [_identity, setIdentity] = useState<Identity>()
  const [ballotAddress] = useLocalStorage('ballotAddress', '');

  useEffect(() => {
    const privateKey = localStorage.getItem("identity")

    if (privateKey) {
      const identity = Identity.import(privateKey)

      setIdentity(identity)

      setLog("Your Semaphore identity has been retrieved from the browser cache 👌🏽")
    } else {
      setLog("Create your Semaphore identity 👆🏽")
    }
  }, [setLog])

  const createIdentity = useCallback(async () => {
    const identity = new Identity()

    setIdentity(identity)

    localStorage.setItem("identity", identity.export())

    setLog("Your new Semaphore identity has just been created 🎉")
  }, [setLog])

  const {data: ballots} = useScaffoldReadContract({
    contractName: "BallotFactory",
    functionName: "getAllBallots",
  });

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
          <h2>Identities</h2>
          <p>
            The identity of a user in the Semaphore protocol. Learn more about <a href="https://docs.semaphore.pse.dev/guides/identities" target="_blank">Semaphore identity</a> and <a href="https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/eddsa-poseidon" target="_blank">EdDSA</a>.
          </p>
          <hr />
          <div>
            <strong>Identity</strong>
          </div>
          {_identity && (
            <div>
              <p><strong>Private Key (base64):</strong><br /> {_identity.export()}</p>
              <p><strong>Public Key:</strong><br /> [{_identity.publicKey[0].toString()}, {_identity.publicKey[1].toString()}]</p>
              <p><strong>Commitment:</strong><br /> {_identity.commitment.toString()}</p>
            </div>
          )}
          <div>
            <button
              className="mt-2 btn btn-secondary" onClick={createIdentity}
            >
              Create Identity
            </button>
          </div>
          <hr />

          {_identity && (
            <div>
              <p><strong>Ballots to join: </strong><br /></p>
              <div className="flex flex-wrap gap-5">
              {ballots?.map((ballot: any, i: number) => (
              <div key={ballot.id} className="flex flex-col items-center">
                <button
                  className="mt-2 btn btn-secondary"
                  onClick={async () => {
                    try {
                      await writeBallotAsync({ functionName: "joinBallot", args: [_identity.commitment], address: ballot });
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Join Ballot {i}
                </button>
              </div>
              ))}
              </div>
            </div>
          )}
          <hr />

          {/* User Joined, time to vote*/}
          {voterUser?.[0] && _identity && (
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
                          const group = new Group([_identity.commitment]);
                          const proposalId = BigInt(i);
                          const { points, merkleTreeDepth, merkleTreeRoot, nullifier } = await generateProof(
                            _identity, 
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

