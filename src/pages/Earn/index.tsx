import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import {
  PFX_STAKING_REWARDS_INFO,
  GAKITA_STAKING_REWARDS_INFO,
  usePfxStakingInfo,
  useGAkitaStakingInfo,
  StakingInfo
} from '../../state/stake/hooks'
import { TYPE, ExternalLink } from '../../theme'
import PoolCard from '../../components/earn/PoolCard'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import { ChainId, JSBI, Token } from '@polarfox/sdk'
import { Countdown } from '../../components/earn/Countdown'
import { gAKITA, PFX } from '../../constants'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `};
`

interface EarnProps {
  rewardToken: Token
  rewardTokenUrl: string
  stakingInfo: StakingInfo[]
  hasStakingRewards: boolean
  depositMessage: string
  emoji: string
}

function Earn({ rewardToken, rewardTokenUrl, stakingInfo, hasStakingRewards, depositMessage, emoji }: EarnProps) {
  const poolGroup = rewardToken.symbol?.toLowerCase() || ''

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <DataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>{rewardToken.name} liquidity mining</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>{depositMessage}</TYPE.white>
              </RowBetween>{' '}
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                href={rewardTokenUrl}
                target="_blank"
              >
                <TYPE.white fontSize={14}>Read more about {rewardToken.symbol}</TYPE.white>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </DataCard>
      </TopSection>

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Participating pools</TYPE.mediumHeader>
          <Countdown exactEnd={stakingInfo?.[0]?.periodFinish} />
        </DataRow>

        <PoolSection>
          {hasStakingRewards && stakingInfo?.length === 0 ? (
            <Loader style={{ margin: 'auto' }} />
          ) : !hasStakingRewards ? (
            'No active rewards'
          ) : (
            stakingInfo
              ?.sort(function(infoA, infoB) {
                // greater stake in avax comes first
                return infoA.totalStakedInWavax?.greaterThan(infoB.totalStakedInWavax ?? JSBI.BigInt(0)) ? -1 : 1
              })
              .sort(function(infoA, infoB) {
                if (infoA.stakedAmount.greaterThan(JSBI.BigInt(0))) {
                  if (infoB.stakedAmount.greaterThan(JSBI.BigInt(0)))
                    // both are being staked, so we keep the previous sorting
                    return 0
                  // the second is actually not at stake, so we should bring the first up
                  else return -1
                } else {
                  if (infoB.stakedAmount.greaterThan(JSBI.BigInt(0)))
                    // first is not being staked, but second is, so we should bring the first down
                    return 1
                  // none are being staked, let's keep the  previous sorting
                  else return 0
                }
              })
              .map(info => {
                return (
                  <PoolCard
                    key={info.stakingRewardAddress}
                    stakingInfo={info}
                    rewardToken={rewardToken}
                    poolGroup={poolGroup}
                    emoji={emoji}
                  />
                )
              })
          )}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}

export function EarnPfx() {
  const pfxStakingInfo = usePfxStakingInfo()
  const { chainId } = useActiveWeb3React()

  const pfx = PFX[chainId ?? ChainId.AVALANCHE]

  const stakingRewardsExist = Boolean(
    typeof chainId === 'number' && (PFX_STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0
  )

  return (
    <Earn
      rewardToken={pfx}
      rewardTokenUrl="https://polarfox.io"
      stakingInfo={pfxStakingInfo}
      hasStakingRewards={stakingRewardsExist}
      depositMessage="Deposit your Polarfox Liquidity Provider PFX-LP tokens to receive PFX, the Polarfox ecosystem governance token."
      emoji={'🦊'}
    />
  )
}

export function EarnGAkita() {
  const gAkitaStakingInfo = useGAkitaStakingInfo()
  const { chainId } = useActiveWeb3React()

  const gAkita = gAKITA[chainId ?? ChainId.AVALANCHE]

  const stakingRewardsExist = Boolean(
    typeof chainId === 'number' && (GAKITA_STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0
  )

  return (
    <Earn
      rewardToken={gAkita}
      rewardTokenUrl="https://akita.network"
      stakingInfo={gAkitaStakingInfo}
      hasStakingRewards={stakingRewardsExist}
      depositMessage="Deposit your Polarfox Liquidity Provider PFX-LP tokens to receive gAkita, the Akita Inu governance token."
      emoji={'🐕'}
    />
  )
}
