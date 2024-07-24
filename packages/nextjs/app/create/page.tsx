"use client";

import type { NextPage } from "next";
import { useAccount, useWriteContract } from "wagmi";
// import { SemaphoreSubgraph } from "@semaphore-protocol/data"
import { useLogContext } from "../../context/LogContext";
import { useCallback, useEffect, useState } from "react";
import {  useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
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
  const { writeContractAsync: writeBallotFactoryAsync} = useScaffoldWriteContract('BallotFactory');
  const [proposals, setProposals] = useState<string[]>(['Proposal 1', 'Proposal 2', 'Proposal 3']);
  const [isWaiting, setIsWaiting] = useState(false);

  useScaffoldWatchContractEvent({
    contractName: "BallotFactory",
    eventName: "BallotCreated",
    onLogs: (logs) => {
      logs.map(log => {
        const { ballotAddress: newBallotAddress } = log.args;

        if(!newBallotAddress || newBallotAddress === ballotAddress) return;

        setBallotAddress(newBallotAddress);

        notification.success('New ballot address: ' + newBallotAddress);
        setIsWaiting(false);
      });
    },
  });

  return (
    <div className="flex flex-col items-center flex-grow pt-10">
      {proposals.map((proposal, index) => (
        <input
          key={index}
          value={proposal}
          onChange={(e) => {
            const newProposals = [...proposals];
            newProposals[index] = e.target.value;
            setProposals(newProposals);
          }}
          className="px-4 py-2 mb-4 text-white border rounded-md w-96"
        />
      ))}
      <button className="p-4 mb-5 rounded-full bg-slate-600 size-14" onClick={() => setProposals(
        (current) => current.concat('Proposal ' + (current.length + 1))
      )}><PlusIcon /></button>

      <button
        onClick={async () => {
          setIsWaiting(true);
          await writeBallotFactoryAsync({
            functionName: 'createBallot',
            args: [proposals.map(prop => toHex(prop, { size: 32 }))],
          });
        }}
        disabled={isWaiting}
        className="px-4 py-2 text-white rounded-md bg-primary">
        {isWaiting ? 'Waiting...' : 'Deploy Ballot'}
        </button>

        {ballotAddress && <p>Current Ballot Address: {ballotAddress}</p>}
    </div>
  );
};

export default Deploy;

