import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, WAVAX, Pair } from '@polarfox/sdk'
import { useMemo } from 'react'
import { PFX, AKITA, gAKITA, WETH, USDT } from '../../constants'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { PairState, usePair, usePairs } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'

export const STAKING_GENESIS = 1600387200 // TODO: Update this - make it depend on the chain Id

export const REWARDS_DURATION_DAYS = 60

export interface StakingRewardsInfo {
  tokens: [Token, Token]
  stakingRewardAddress: string
}

// TODO: Update all the staking rewards addresses here
export const PFX_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: StakingRewardsInfo[]
} = {
  [ChainId.AVALANCHE]: [],
  [ChainId.FUJI]: [
    {
      tokens: [PFX[ChainId.FUJI], WAVAX[ChainId.FUJI]],
      stakingRewardAddress: '0xa1Ae93D4C9c4271297653CF654d0B4d5105d8251'
    },
    {
      tokens: [PFX[ChainId.FUJI], WETH[ChainId.FUJI]],
      stakingRewardAddress: '0xCfB90b451D0f2FF417820D3A79b95F12EE001e03'
    },
    {
      tokens: [PFX[ChainId.FUJI], USDT[ChainId.FUJI]],
      stakingRewardAddress: '0x25A3887a3Faf119Aa6420268305DB0AaFBe31B12'
    },
    {
      tokens: [WAVAX[ChainId.FUJI], WETH[ChainId.FUJI]],
      stakingRewardAddress: '0x3e6B8a36bf6De077BBBa89D93f3cD6B7dba6aCc4'
    },
    {
      tokens: [WAVAX[ChainId.FUJI], USDT[ChainId.FUJI]],
      stakingRewardAddress: '0xc1DDC5A427465ffb913CF247a92DdE84443a252d'
    }
  ]
}

export const GAKITA_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: StakingRewardsInfo[]
} = {
  [ChainId.AVALANCHE]: [],
  [ChainId.FUJI]: [
    {
      tokens: [AKITA[ChainId.FUJI], PFX[ChainId.FUJI]],
      stakingRewardAddress: '0xcb9bD879f44B00B3223EBc2347aa7C97B470c3a5'
    },
    {
      tokens: [AKITA[ChainId.FUJI], WAVAX[ChainId.FUJI]],
      stakingRewardAddress: '0x0a6e5bFe21B7612f1841e4956e7964a8AE8380e7'
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

const calculateTotalStakedAmountInAvaxFromMainToken = function(
  totalSupply: JSBI,
  avaxMainTokenPairReserveOfMainToken: JSBI,
  avaxMainTokenPairReserveOfOtherToken: JSBI,
  stakingTokenPairReserveOfMainToken: JSBI,
  totalStakedAmount: TokenAmount,
  chainId: ChainId | undefined
): TokenAmount {
  const oneToken = JSBI.BigInt(1000000000000000000)
  if (JSBI.equal(totalSupply, JSBI.BigInt(0)))
    return new TokenAmount(chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE], JSBI.BigInt(0))

  const avaxMainTokenRatio = JSBI.notEqual(avaxMainTokenPairReserveOfMainToken, JSBI.BigInt(0))
    ? JSBI.divide(JSBI.multiply(oneToken, avaxMainTokenPairReserveOfOtherToken), avaxMainTokenPairReserveOfMainToken)
    : JSBI.BigInt(0)

  if (JSBI.equal(avaxMainTokenPairReserveOfMainToken, JSBI.BigInt(0)))
    console.warn('avaxMainTokenPairReserveOfMainToken is zero, avaxMainTokenRatio will be wrong')

  const valueOfMainTokenInAvax = JSBI.divide(
    JSBI.multiply(stakingTokenPairReserveOfMainToken, avaxMainTokenRatio),
    oneToken
  )

  return new TokenAmount(
    chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE],
    JSBI.divide(
      JSBI.multiply(
        JSBI.multiply(totalStakedAmount.raw, valueOfMainTokenInAvax),
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
function useStakingInfo(
  stakingRewardsInfo: {
    [chainId in ChainId]?: StakingRewardsInfo[] | undefined
  },
  mainToken: Token,
  rewardToken: Token,
  pairToFilterBy?: Pair | null,
  chainId?: ChainId,
  account?: string | null | undefined
): StakingInfo[] {
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

  const wavax = chainId ? WAVAX[chainId] : WAVAX[ChainId.AVALANCHE]

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const tokens = useMemo(() => info.map(({ tokens }) => tokens), [info])
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')
  const pairs = usePairs(tokens)
  const [avaxMainTokenPairState, avaxMainTokenPair] = usePair(wavax, mainToken)

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
    if (!chainId || !mainToken) return []

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
        avaxMainTokenPair &&
        pairState !== PairState.LOADING &&
        avaxMainTokenPairState !== PairState.LOADING
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error ||
          pairState === PairState.INVALID ||
          pairState === PairState.NOT_EXISTS ||
          avaxMainTokenPairState === PairState.INVALID ||
          avaxMainTokenPairState === PairState.NOT_EXISTS
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
        const totalRewardRate = new TokenAmount(rewardToken, JSBI.BigInt(rewardRateState.result?.[0]))
        const isAvaxPool = tokens[0].equals(WAVAX[tokens[0].chainId]) || tokens[1].equals(WAVAX[tokens[1].chainId])

        const totalStakedInWavax = isAvaxPool
          ? calculateTotalStakedAmountInAvax(totalSupply, pair.reserveOf(wavax).raw, totalStakedAmount, chainId)
          : calculateTotalStakedAmountInAvaxFromMainToken(
              totalSupply,
              avaxMainTokenPair.reserveOf(mainToken).raw,
              avaxMainTokenPair.reserveOf(WAVAX[tokens[1].chainId]).raw,
              pair.involvesToken(mainToken) ? pair.reserveOf(mainToken).raw : JSBI.BigInt(0),
              totalStakedAmount,
              chainId
            )

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount,
          totalStakedAmount: TokenAmount,
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          if (JSBI.equal(totalStakedAmount.raw, JSBI.BigInt(0))) {
            return new TokenAmount(rewardToken, JSBI.BigInt(0))
          }

          if (JSBI.equal(totalStakedAmount.raw, JSBI.BigInt(0)))
            console.warn('totalStakedAmount is zero, hypotheticalRewardRate will be wrong')

          return new TokenAmount(
            rewardToken,
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
          earnedAmount: new TokenAmount(rewardToken, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
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
    avaxMainTokenPairState,
    pairs,
    mainToken,
    rewardToken,
    avaxMainTokenPair
  ])
}

export function usePfxStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const pfx = chainId ? PFX[chainId] : PFX[ChainId.AVALANCHE]
  return useStakingInfo(PFX_STAKING_REWARDS_INFO, pfx, pfx, pairToFilterBy, chainId, account)
}

export function useGAkitaStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const akita = chainId ? AKITA[chainId] : AKITA[ChainId.AVALANCHE]
  const gAkita = chainId ? gAKITA[chainId] : gAKITA[ChainId.AVALANCHE]
  return useStakingInfo(GAKITA_STAKING_REWARDS_INFO, akita, gAkita, pairToFilterBy, chainId, account)
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
