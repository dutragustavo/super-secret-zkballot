import { useEffect } from "react";
import { useTargetNetwork } from "./scaffold-eth/useTargetNetwork";
import { QueryObserverResult, RefetchOptions, useQueryClient } from "@tanstack/react-query";
import type { Address, ExtractAbiFunctionNames } from "abitype";
import { ReadContractErrorType } from "viem";
import { useBlockNumber, useReadContract } from "wagmi";
import {
  AbiFunctionReturnType,
  ContractAbi,
} from "~~/utils/scaffold-eth/contract";
import { abi } from "../../hardhat/artifacts/contracts/Ballot.sol/Ballot.json";


export const useReadBallotContract = ({
  contractName,
  functionName,
  args,
  address,
  ...readConfig
}: any) => {
  const { targetNetwork } = useTargetNetwork();
  const { query: queryOptions, watch, ...readContractConfig } = readConfig;
  // set watch to true by default
  const defaultWatch = watch ?? true;

  const readContractHookRes = useReadContract({
    chainId: targetNetwork.id,
    functionName,
    address,
    abi,
    args,
    ...(readContractConfig as any),
    query: {
      enabled: !Array.isArray(args) || !args.some(arg => arg === undefined),
      ...queryOptions,
    },
  }) as Omit<ReturnType<typeof useReadContract>, "data" | "refetch"> & {
    data: any;
    refetch: (
      options?: RefetchOptions | undefined,
    ) => Promise<QueryObserverResult<AbiFunctionReturnType<ContractAbi, any>, ReadContractErrorType>>;
  };

  const queryClient = useQueryClient();
  const { data: blockNumber } = useBlockNumber({
    watch: defaultWatch,
    chainId: targetNetwork.id,
    query: {
      enabled: defaultWatch,
    },
  });

  useEffect(() => {
    if (defaultWatch) {
      queryClient.invalidateQueries({ queryKey: readContractHookRes.queryKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  return readContractHookRes;
};
