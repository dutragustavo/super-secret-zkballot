"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { generateProof, Group, Identity } from "@semaphore-protocol/core"
// import { SemaphoreSubgraph } from "@semaphore-protocol/data"
import { useLogContext } from "../../context/LogContext";
import { useCallback, useEffect, useState } from "react";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Proposal {
  name: string;
  voteCount: BigInt;
}

const Vote: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { setLog } = useLogContext()
  const [_identity, setIdentity] = useState<Identity>()

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

  const { data: proposalCount } = useScaffoldReadContract({
    contractName: "Ballot",
    functionName: "proposalCount",
  });


  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    async function fetchProposals() {
      if (typeof proposalCount === 'number') {
        const proposalsArray: Proposal[] = [];
        for (let i = 0; i < proposalCount; i++) {
          const proposal = await useScaffoldReadContract({
            contractName: "Ballot",
            functionName: "proposals",
            args: [BigInt(i)],
          });
          // Assume proposal.data returns the necessary data in the correct format
          if (proposal.data) {
            proposalsArray.push({
              name: proposal.data[0],
              voteCount: proposal.data[1] // Adjust according to actual data structure
            });
          }
        }
        setProposals(proposalsArray);
      }
    }

    fetchProposals();
  }, [proposalCount]);

  const { data: voterUser } = useScaffoldReadContract({
    contractName: "Ballot",
    functionName: "voters",
    args: [connectedAddress],
  });

  const { data: groupId } = useScaffoldReadContract({
    contractName: "Ballot",
    functionName: "groupId",
  });

  const { writeContractAsync: writeBallotAsync } = useScaffoldWriteContract("Ballot");
  const { data: ballotContractData } = useDeployedContractInfo("Ballot");


  return (
    <>
      <>
        <div className="flex items-center flex-col flex-grow pt-10">
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
              className="btn btn-secondary mt-2" onClick={createIdentity}
            >
              Create Identity
            </button>
          </div>
          <hr />

          {_identity && (
            <div>
              <p><strong>Current Ballot Address: </strong><br /> {ballotContractData?.address}</p>
              <button
                className="btn btn-secondary mt-2"
                onClick={async () => {
                  try {
                    await writeBallotAsync({ functionName: "joinBallot", args: [_identity.commitment] });
                  } catch (err) {
                    console.error("Error joining the ballot");
                  }
                }}
              >
                Join Ballot
              </button>
            </div>
          )}
          <hr />

          {/* User Joined, time to vote*/}
          {voterUser?.[0] && _identity && (
            <div>
              <p><strong>Proposals</strong><br /> {ballotContractData?.address}</p>
              <div>
                {proposals.map((proposal, index) => (
                  <div key={index}>
                    <p>Proposal {index + 1}: {proposal.name}</p>
                  </div>
                ))}
              </div>

              {/*This button will only vote for the proposal 0 
                Putting it here just to save the voting logic */}
              
              <button
                className="btn btn-secondary mt-2"
                onClick={async () => {
                  try {
                    // Uncomment this when we deploy to Sepolia. We'll recreate the group from the Ballot contract 
                    // to replicate the on-chain group off-chain. This is needed to generate the proofs.
                    // const semaphoreSubgraph = new SemaphoreSubgraph("sepolia")
                    // const { members } = await semaphoreSubgraph.getGroup(groupId?.toString() || "0", { members: true })
                    // const group = new Group(members);
                    
                    // Group of only one user, just for the local tests
                    const group = new Group([_identity.commitment]);
                    const proposalId = 0n;
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
                Vote for proposal 0
              </button>

            </div>
          )}




        </div>
      </>
    </>
  );
};

export default Vote;

