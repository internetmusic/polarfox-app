import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import {
  PFX_STAKING_REWARDS_INFO,
  GAKITA_STAKING_REWARDS_INFO,
  usePfxStakingInfo,
  useGAkitaStakingInfo
} from '../../state/stake/hooks'
import { TYPE, ExternalLink } from '../../theme'
import PoolCard from '../../components/earn/PoolCard'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import { JSBI } from '@polarfox/sdk'
import { Countdown } from '../../components/earn/Countdown'

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

export function Earn(isPfx: boolean) {
  const stakingRewardsInfo = isPfx ? PFX_STAKING_REWARDS_INFO : GAKITA_STAKING_REWARDS_INFO
  const stakingInfoGetter = isPfx ? usePfxStakingInfo : useGAkitaStakingInfo

  const { chainId } = useActiveWeb3React()
  const stakingInfos = stakingInfoGetter()

  const DataRow = styled(RowBetween)`
    ${({ theme }) => theme.mediaWidth.upToSmall`
     flex-direction: column;
   `};
  `

  const stakingRewardsExist = Boolean(typeof chainId === 'number' && (stakingRewardsInfo[chainId]?.length ?? 0) > 0)

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <DataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Polarfox liquidity mining</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Deposit your Polarfox Liquidity Provider PFX-LP tokens to receive PFX, the Polarfox protocol
                  governance token.
                </TYPE.white>
              </RowBetween>{' '}
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                href="https://polarfox.io/litepaper" // TODO: Put the litepaper URL here
                target="_blank"
              >
                <TYPE.white fontSize={14}>Read more about PFX</TYPE.white>
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
          <Countdown exactEnd={stakingInfos?.[0]?.periodFinish} />
        </DataRow>

        <PoolSection>
          {stakingRewardsExist && stakingInfos?.length === 0 ? (
            <Loader style={{ margin: 'auto' }} />
          ) : !stakingRewardsExist ? (
            'No active rewards'
          ) : (
            stakingInfos
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
              .map(stakingInfo => {
                return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} isPfx={isPfx} />
              })
          )}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}

export function EarnPfx() {
  return Earn(true)
}

export function EarnGAkita() {
  return Earn(false)
}
