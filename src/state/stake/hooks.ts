import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, WAVAX, Pair } from '@polarfox/sdk'
import { useMemo } from 'react'
import { PFX, AKITA, TEST1 } from '../../constants'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { PairState, usePair, usePairs } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'

export const STAKING_GENESIS = 1600387200 // TODO: Update this - make it depend on the chain Id

export const REWARDS_DURATION_DAYS = 60

// TODO: Update all the staking rewards addresses here
export const PFX_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.AVALANCHE]: [],
  [ChainId.FUJI]: [
    {
      tokens: [PFX[ChainId.FUJI], WAVAX[ChainId.FUJI]],
      stakingRewardAddress: '0x4bBd083B7DdF1e7019f6abB14738D4Ff4F686EcA'
    },
    {
      tokens: [PFX[ChainId.FUJI], TEST1[ChainId.FUJI]],
      stakingRewardAddress: '0x5bBE66E9C8D0A9877A1CC4bD203E03174Ca28928'
    },
    {
      tokens: [WAVAX[ChainId.FUJI], TEST1[ChainId.FUJI]],
      stakingRewardAddress: '0xEa40Eee828ee265915e0CFc634bEf078E27F1D28'
    }
  ]
}

export const GAKITA_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.AVALANCHE]: [],
  [ChainId.FUJI]: [
    {
      tokens: [AKITA[ChainId.FUJI], PFX[ChainId.FUJI]],
      stakingRewardAddress: '0xeb1E41117F816aF98E0Dd3c22Ee4A97A2E5B08fA'
    },
    {
      tokens: [AKITA[ChainId.FUJI], WAVAX[ChainId.FUJI]],
      stakingRewardAddress: '0x9f61fCDC2B7c286fD382ef59E4E85E6CeedDd16A'
    }
  ]
}

export interface StakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  tokens: [Token, Token]
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate: TokenAmount
  //  total staked Avax in the pool
  totalStakedInWavax: TokenAmount
  // when the period ends
  periodFinish: Date | undefined
  // calculates a hypothetical amount of token distributed to the active account per second.
  getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRate: TokenAmount
  ) => TokenAmount
}

const calculateTotalStakedAmountInAvaxFromPfx = function(
  totalSupply: JSBI,
  avaxPfxPairReserveOfPfx: JSBI,
  avaxPfxPairReserveOfOtherToken: JSBI,
  stakingTokenPairReserveOfPfx: JSBI,
  totalStakedAmount: TokenAmount,
  chainId: ChainId | undefined
): TokenAmount {
  const oneToken = JSBI.BigInt(1000000000000000000)
  if (
    JSBI.equal(totalSupply, JSBI.BigInt(0)) ||
    JSBI.equal(totalSupply, JSBI.BigInt(0)) ||
    JSBI.equal(totalSupply, JSBI.BigInt(0))
  ) {
    return new TokenAmount(chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE], JSBI.BigInt(0))
  }

  const avaxPfxRatio = JSBI.divide(JSBI.multiply(oneToken, avaxPfxPairReserveOfOtherToken), avaxPfxPairReserveOfPfx)

  const valueOfPfxInAvax = JSBI.divide(JSBI.multiply(stakingTokenPairReserveOfPfx, avaxPfxRatio), oneToken)

  return new TokenAmount(
    chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE],
    JSBI.divide(
      JSBI.multiply(
        JSBI.multiply(totalStakedAmount.raw, valueOfPfxInAvax),
        JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the wavax they entitle owner to
      ),
      totalSupply
    )
  )
}

const calculateTotalStakedAmountInAvax = function(
  totalSupply: JSBI,
  reserveInWavax: JSBI,
  totalStakedAmount: TokenAmount,
  chainId: ChainId | undefined
): TokenAmount {
  // take the total amount of LP tokens staked, multiply by AVAX value of all LP tokens, divide by all LP tokens
  if (JSBI.equal(totalSupply, JSBI.BigInt(0))) {
    return new TokenAmount(chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE], JSBI.BigInt(0))
  }

  return new TokenAmount(
    chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE],
    JSBI.divide(
      JSBI.multiply(
        JSBI.multiply(totalStakedAmount.raw, reserveInWavax),
        JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the wavax they entitle owner to
      ),
      totalSupply
    )
  )
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(
  stakingRewardsInfo: {
    [chainId in ChainId]?: { tokens: [Token, Token]; stakingRewardAddress: string }[] | undefined
  },
  pairToFilterBy?: Pair | null
): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(
    () =>
      chainId
        ? stakingRewardsInfo[chainId]?.filter(stakingRewardInfo =>
            pairToFilterBy === undefined
              ? true
              : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
                pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
          ) ?? []
        : [],
    [chainId, pairToFilterBy, stakingRewardsInfo]
  )

  const pfx = chainId ? PFX[chainId] : PFX[ChainId.AVALANCHE]
  const wavax = chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE]

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const tokens = useMemo(() => info.map(({ tokens }) => tokens), [info])
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')
  const pairs = usePairs(tokens)
  const [avaxPfxPairState, avaxPfxPair] = usePair(wavax, pfx)

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )
  const periodFinishes = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (!chainId || !pfx) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const periodFinishState = periodFinishes[index]
      const [pairState, pair] = pairs[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !earnedAmountState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        periodFinishState &&
        !periodFinishState.loading &&
        pair &&
        avaxPfxPair &&
        pairState !== PairState.LOADING &&
        avaxPfxPairState !== PairState.LOADING
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error ||
          pairState === PairState.INVALID ||
          pairState === PairState.NOT_EXISTS ||
          avaxPfxPairState === PairState.INVALID ||
          avaxPfxPairState === PairState.NOT_EXISTS
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the LP token
        const tokens = info[index].tokens
        const wavax = tokens[0].equals(WAVAX[tokens[0].chainId]) ? tokens[0] : tokens[1]
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'), chainId)
        // check for account, if no account set to 0

        const totalSupply = JSBI.BigInt(totalSupplyState.result?.[0])
        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, totalSupply)
        const totalRewardRate = new TokenAmount(pfx, JSBI.BigInt(rewardRateState.result?.[0]))
        const isAvaxPool = tokens[0].equals(WAVAX[tokens[0].chainId])
        const totalStakedInWavax = isAvaxPool
          ? calculateTotalStakedAmountInAvax(totalSupply, pair.reserveOf(wavax).raw, totalStakedAmount, chainId)
          : calculateTotalStakedAmountInAvaxFromPfx(
              totalSupply,
              avaxPfxPair.reserveOf(pfx).raw,
              avaxPfxPair.reserveOf(WAVAX[tokens[1].chainId]).raw,
              pair.involvesToken(pfx) ? pair.reserveOf(pfx).raw : JSBI.BigInt(0), // TODO: What if there is no PFX in this pair
              totalStakedAmount,
              chainId
            )

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount,
          totalStakedAmount: TokenAmount,
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          if (JSBI.equal(totalStakedAmount.raw, JSBI.BigInt(0))) {
            return new TokenAmount(pfx, JSBI.BigInt(0))
          }
          return new TokenAmount(
            pfx,
            JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
              ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
              : JSBI.BigInt(0)
          )
        }

        const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

        const periodFinishMs = periodFinishState.result?.[0]?.mul(1000)?.toNumber()

        memo.push({
          stakingRewardAddress: rewardsAddress,
          tokens: tokens,
          periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
          earnedAmount: new TokenAmount(pfx, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
          rewardRate: individualRewardRate,
          totalRewardRate: totalRewardRate,
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          totalStakedInWavax: totalStakedInWavax,
          getHypotheticalRewardRate
        })
      }
      return memo
    }, [])
  }, [
    balances,
    chainId,
    earnedAmounts,
    info,
    periodFinishes,
    rewardRates,
    rewardsAddresses,
    totalSupplies,
    avaxPfxPairState,
    pairs,
    pfx,
    avaxPfxPair
  ])
}

export function usePfxStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  return useStakingInfo(PFX_STAKING_REWARDS_INFO, pairToFilterBy)
}

export function useGAkitaStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  return useStakingInfo(GAKITA_STAKING_REWARDS_INFO, pairToFilterBy)
}

export function useTotalPfxEarned(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const pfx = chainId ? PFX[chainId] : undefined
  const stakingInfos = usePfxStakingInfo()

  return useMemo(() => {
    if (!pfx) return undefined
    return (
      stakingInfos?.reduce(
        (accumulator, stakingInfo) => accumulator.add(stakingInfo.earnedAmount),
        new TokenAmount(pfx, '0')
      ) ?? new TokenAmount(pfx, '0')
    )
  }, [stakingInfos, pfx])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}
