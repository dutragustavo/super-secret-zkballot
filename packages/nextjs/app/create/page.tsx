"use client";

import type { NextPage } from "next";
import { useAccount, useWriteContract } from "wagmi";
import { useLogContext } from "../../context/LogContext";
import { useCallback, useEffect, useState } from "react";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { toHex } from "viem";
import { useLocalStorage } from "usehooks-ts";
import { PlusCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { notification } from "~~/utils/scaffold-eth";

interface Proposal {
  name: string;
  voteCount: BigInt;
}

const Deploy: NextPage = () => {
  const [ballotAddress, setBallotAddress] = useLocalStorage('ballotAddress', '');
  const { writeContractAsync: writeBallotFactoryAsync } = useScaffoldWriteContract('BallotFactory');
  const [proposals, setProposals] = useState<string[]>(['Proposal 1', 'Proposal 2', 'Proposal 3']);
  const [isWaiting, setIsWaiting] = useState(false);

  useScaffoldWatchContractEvent({
    contractName: "BallotFactory",
    eventName: "BallotCreated",
    onLogs: (logs) => {
      logs.map(log => {
        const { ballotAddress: newBallotAddress } = log.args;

        if (!newBallotAddress || newBallotAddress === ballotAddress) return;

        setBallotAddress(newBallotAddress);

        notification.success('New ballot address: ' + newBallotAddress);
        setIsWaiting(false);
      });
    },
  });

  return (
    <div className="flex flex-col items-center flex-grow pt-10 space-y-6 bg-base-200 p-6 rounded-lg shadow-md">
      <h1 className="mb-5 text-5xl font-bold text-neutral" >Create new Ballot from scratch</h1>
      <b className="mb-5 text-2xl text-accent" style={{ opacity: 1.2 }}> Enter the name of each proposal for your ballot</b>
      <div className="flex flex-col items-center space-y-2 w-full">
        {proposals.map((proposal, index) => (
          <input
            key={index}
            value={proposal}
            onChange={(e) => {
              const newProposals = [...proposals];
              newProposals[index] = e.target.value;
              setProposals(newProposals);
            }}
            className="input input-bordered w-full max-w-lg"
            placeholder={`Proposal ${index + 1}`}
          />
        ))}
        <button
          className="btn btn-outline btn-circle"
          onClick={() => setProposals((current) => current.concat(`Proposal ${current.length + 1}`))}
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      <button
        onClick={async () => {
          setIsWaiting(true);
          await writeBallotFactoryAsync({
            functionName: 'createBallot',
            args: [proposals.map(prop => toHex(prop, { size: 32 }))],
          });
        }}
        disabled={isWaiting}
        className={`btn btn-primary ${isWaiting ? 'loading' : ''}`}
      >
        {isWaiting ? 'Waiting...' : 'Deploy Ballot'}
      </button>

      {ballotAddress && (
        <div className="alert alert-info shadow-lg mt-4 w-full max-w-lg">
          <div>
            <span>Current Ballot Address: {ballotAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deploy;
