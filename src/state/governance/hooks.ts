import { gAKITA, PFX } from './../../constants/index'
import { Token, TokenAmount } from '@polarfox/sdk'
import { isAddress } from 'ethers/lib/utils'
import {
  usePfxGovernanceContract,
  usePfxContract,
  useAkitaGovernanceContract,
  useGAkitaContract
} from '../../hooks/useContract'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
import { useActiveWeb3React } from '../../hooks'
import { Contract, ethers, utils } from 'ethers'
import { calculateGasMargin } from '../../utils'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../transactions/hooks'
import { useState, useEffect, useCallback } from 'react'
import { abi as PFX_GOV_ABI } from '@polarfox/governance/artifacts/contracts/GovernorAlpha.sol/GovernorAlpha.json'
import { abi as AKITA_GOV_ABI } from '@polarfox/akita-governance/artifacts/contracts/GovernorAlpha.sol/GovernorAlpha.json'

interface ProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  status: string
  forCount: number
  againstCount: number
  startTime: number
  endTime: number
  startBlock: number
  details: ProposalDetail[]
}

const enumerateProposalState = (state: number) => {
  const proposalStates = ['pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed']
  return proposalStates[state]
}

// get count of all proposals made
function useProposalCount(govContract: Contract | null): number | undefined {
  const res = useSingleCallResult(govContract, 'proposalCount')
  if (res.result && !res.loading) {
    return parseInt(res.result[0])
  }
  return undefined
}

export function usePfxProposalCount(): number | undefined {
  const pfxGov = usePfxGovernanceContract()

  return useProposalCount(pfxGov)
}

export function useGAkitaProposalCount(): number | undefined {
  const akitaGov = useAkitaGovernanceContract()

  return useProposalCount(akitaGov)
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
function useDataFromEventLogs(govContract: Contract | null, govAbi: any) {
  const { library } = useActiveWeb3React()
  const [formattedEvents, setFormattedEvents] = useState<any>()

  // create filter for these specific events
  const filter = { ...govContract?.filters?.['ProposalCreated'](), fromBlock: 0, toBlock: 'latest' }
  const eventParser = new ethers.utils.Interface(govAbi)

  useEffect(() => {
    async function fetchData() {
      const pastEvents = await library?.getLogs(filter)
      // reverse events to get them from newest to odlest
      const formattedEventData = pastEvents
        ?.map(event => {
          const eventParsed = eventParser.parseLog(event).args
          return {
            description: eventParsed.description,
            details: eventParsed.targets.map((target: string, i: number) => {
              const signature = eventParsed.signatures[i]
              const [name, types] = signature.substr(0, signature.length - 1).split('(')

              const calldata = eventParsed.calldatas[i]
              const decoded = utils.defaultAbiCoder.decode(types.split(','), calldata)

              return {
                target,
                functionSig: name,
                callData: decoded.join(', ')
              }
            })
          }
        })
        .reverse()
      setFormattedEvents(formattedEventData)
    }
    if (!formattedEvents) {
      fetchData()
    }
  }, [eventParser, filter, library, formattedEvents])

  return formattedEvents
}

export function useDataFromPfxEventLogs() {
  const pfxGov = usePfxGovernanceContract()

  return useDataFromEventLogs(pfxGov, PFX_GOV_ABI)
}

export function useDataFromGAkitaEventLogs() {
  const akitaGov = useAkitaGovernanceContract()

  return useDataFromEventLogs(akitaGov, AKITA_GOV_ABI)
}

// get data for all past and active proposals
function useAllProposalData(
  proposalCount: number | undefined,
  govContract: Contract | null,
  events: any
): ProposalData[] {
  const proposalIndexes = []
  for (let i = 1; i <= (proposalCount ?? 0); i++) {
    proposalIndexes.push([i])
  }

  // get all proposal entities
  const allProposals = useSingleContractMultipleData(govContract, 'proposals', proposalIndexes)

  // get all proposal states
  const allProposalStates = useSingleContractMultipleData(govContract, 'state', proposalIndexes)

  if (events && allProposals && allProposalStates) {
    allProposals.reverse()
    allProposalStates.reverse()

    return allProposals
      .filter((p, i) => {
        return Boolean(p.result) && Boolean(allProposalStates[i]?.result) && Boolean(events[i])
      })
      .map((p, i) => {
        const description = events[i].description
        const formattedProposal: ProposalData = {
          id: allProposals[i]?.result?.id.toString(),
          title: description?.split(/# |\n/g)[1] || 'Untitled',
          description: description || 'No description.',
          proposer: allProposals[i]?.result?.proposer,
          status: enumerateProposalState(allProposalStates[i]?.result?.[0]) ?? 'Undetermined',
          forCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.forVotes.toString() ?? 0, 18)),
          againstCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.againstVotes.toString() ?? 0, 18)),
          startTime: parseInt(allProposals[i]?.result?.startTime?.toString()),
          endTime: parseInt(allProposals[i]?.result?.endTime?.toString()),
          startBlock: parseInt(allProposals[i]?.result?.startBlock?.toString()),
          details: events[i].details
        }
        return formattedProposal
      })
  }

  return []
}

export function useAllPfxProposalData(): ProposalData[] {
  const proposalCount = usePfxProposalCount()
  const gov = usePfxGovernanceContract()
  const events = useDataFromPfxEventLogs()

  return useAllProposalData(proposalCount, gov, events)
}

export function useAllGAkitaProposalData(): ProposalData[] {
  const proposalCount = useGAkitaProposalCount()
  const gov = useAkitaGovernanceContract()
  const events = useDataFromGAkitaEventLogs()

  return useAllProposalData(proposalCount, gov, events)
}

function useProposalData(id: string, proposals: ProposalData[]): ProposalData | undefined {
  return proposals?.find(p => p.id === id)
}

export function usePfxProposalData(id: string) {
  const proposals = useAllPfxProposalData()
  return useProposalData(id, proposals)
}

export function useGAkitaProposalData(id: string) {
  const proposals = useAllGAkitaProposalData()
  return useProposalData(id, proposals)
}

// get the users delegatee if it exists
function useUserDelegatee(tokenContract: Contract | null): string {
  const { account } = useActiveWeb3React()
  const { result } = useSingleCallResult(tokenContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}

export function usePfxUserDelegatee(): string {
  const pfxContract = usePfxContract()

  return useUserDelegatee(pfxContract)
}

export function useGAkitaUserDelegatee(): string {
  const gAkitaContract = useGAkitaContract()

  return useUserDelegatee(gAkitaContract)
}

function useUserVotes(token: Token | undefined, tokenContract: Contract | null): TokenAmount | undefined {
  const { account } = useActiveWeb3React()

  // check for available votes
  const votes = useSingleCallResult(tokenContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && token ? new TokenAmount(token, votes) : undefined
}

export function usePfxUserVotes(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const pfxContract = usePfxContract()

  const pfx = chainId ? PFX[chainId] : undefined

  return useUserVotes(pfx, pfxContract)
}

export function useGAkitaUserVotes(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const gAkitaContract = useGAkitaContract()

  const gAkita = chainId ? gAKITA[chainId] : undefined

  return useUserVotes(gAkita, gAkitaContract)
}

export type DelegateCallback = (delegatee: string | undefined) => undefined | Promise<string>

function useDelegateCallback(tokenContract: Contract | null): DelegateCallback {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!library || !chainId || !account || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!tokenContract) throw new Error('No token contract!')
      return tokenContract.estimateGas.delegate(...args, {}).then(estimatedGasLimit => {
        return tokenContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Delegated votes`
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, library, tokenContract]
  )
}

export function usePfxDelegateCallback(): DelegateCallback {
  const pfxContract = usePfxContract()

  return useDelegateCallback(pfxContract)
}

export function useGAkitaDelegateCallback(): DelegateCallback {
  const gAkitaContract = useGAkitaContract()

  return useDelegateCallback(gAkitaContract)
}

export type VoteCallback = (proposalId: string | undefined, support: boolean) => undefined | Promise<string>

function useVoteCallback(govContract: Contract | null): VoteCallback {
  const { account } = useActiveWeb3React()

  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !govContract || !proposalId) return
      const args = [proposalId, support]
      return govContract.estimateGas.castVote(...args, {}).then(estimatedGasLimit => {
        return govContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, govContract]
  )
  return voteCallback
}

export function usePfxVoteCallback(): VoteCallback {
  const gov = usePfxGovernanceContract()

  return useVoteCallback(gov)
}

export function useGAkitaVoteCallback(): VoteCallback {
  const gov = useAkitaGovernanceContract()

  return useVoteCallback(gov)
}
