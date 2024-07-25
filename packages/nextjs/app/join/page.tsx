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
import { useRouter } from "next/navigation";

interface Proposal {
  name: string;
  voteCount: BigInt;
}

const Vote: NextPage = () => {
  
  const { address: connectedAddress } = useAccount();
  const { setLog } = useLogContext()
  const [_identity, setIdentity] = useState<Identity>()
  const [ballotAddress, setBallotAddress] = useLocalStorage('ballotAddress', '');
  const { push } = useRouter();
  const [showPrivateKey, setShowPrivateKey] = useState(false);


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
          <h1 className="mb-5 text-5xl font-bold text-neutral">Join a Group</h1>
          <p className="mb-5 text-2xl text-accent" >
            The identity of a user in the Semaphore protocol.</p>
         
          <br />
          <h2 className="card-title mb-4">Your Identity Information</h2>
          {_identity && (
            <div>
              <p className="mb-2">
                <strong>Private Key (base64):</strong><br />
                <span className="flex items-center">
                  {showPrivateKey ? (
                    <span className="text-sm break-all">{_identity.export()}</span>
                  ) : (
                    <span>••••••••••••••••</span>
                  )}
                  <button
                    className="btn btn-ghost btn-sm ml-2"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </span>
              </p>
              <p><strong>Public Key:</strong><br /> [{_identity.publicKey[0].toString()}, {_identity.publicKey[1].toString()}]</p>
              <p><strong>Commitment:</strong><br /> {_identity.commitment.toString()}</p>
            </div>
          )}
          
          <div>
            <button
              className="btn btn-primary" onClick={createIdentity}
            >
              Refresh Identity
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
                    className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await writeBallotAsync({ functionName: "joinBallot", args: [_identity.commitment], address: ballot });
                      setBallotAddress(ballot);
                      push("/vote");
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
              <br />
              <br />
              <br />
              <p className="mb-5 text-1xl text-accent" >  Learn more about <a className="text-neutral" href="https://docs.semaphore.pse.dev/guides/identities" target="_blank">Semaphore identity</a> and <a className="text-neutral" href="https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/eddsa-poseidon" target="_blank">EdDSA</a>.
              </p>
            </div>
          )}
          <hr />
        </div>
      </>
    </>
  );
};

export default Vote;

