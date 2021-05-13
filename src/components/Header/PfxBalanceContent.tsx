import { ChainId, TokenAmount, WAVAX, JSBI } from '@polarfox/sdk'
import React, { useMemo } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import tokenLogo from '../../assets/images/pfx-logo.png'
import { PFX } from '../../constants'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import useCurrentBlockTimestamp from '../../hooks/useCurrentBlockTimestamp'
import { useTotalPfxEarned } from '../../state/stake/hooks'
import { useAggregatePfxBalance, useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE, PfxTokenAnimated } from '../../theme'
import { computePfxCirculation } from '../../utils/computePfxCirculation'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Break, CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { usePair } from '../../data/Reserves'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #33adff 0%, #0033cc 100%);
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function PfxBalanceContent({ setShowPfxBalanceModal }: { setShowPfxBalanceModal: any }) {
  const { account, chainId } = useActiveWeb3React()
  const pfx = chainId ? PFX[chainId] : undefined

  const total = useAggregatePfxBalance()
  const pfxBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, pfx)
  const pfxToClaim: TokenAmount | undefined = useTotalPfxEarned()

  const totalSupply: TokenAmount | undefined = useTotalSupply(pfx)

  // Determine PFX price in AVAX
  const wavax = WAVAX[chainId ? chainId : 43114]
  const [, avaxPfxTokenPair] = usePair(wavax, pfx)
  const oneToken = JSBI.BigInt(1000000000000000000)
  let pfxPrice: Number | undefined
  if (avaxPfxTokenPair && pfx) {
    const avaxPfxRatio = JSBI.divide(
      JSBI.multiply(oneToken, avaxPfxTokenPair.reserveOf(wavax).raw),
      avaxPfxTokenPair.reserveOf(pfx).raw
    )
    pfxPrice = JSBI.toNumber(avaxPfxRatio) / 1000000000000000000
  }

  const blockTimestamp = useCurrentBlockTimestamp()
  const circulation: TokenAmount | undefined = useMemo(
    () =>
      blockTimestamp && pfx && (chainId === ChainId.AVALANCHE || chainId === ChainId.FUJI)
        ? computePfxCirculation(pfx, blockTimestamp)
        : totalSupply,
    [blockTimestamp, chainId, totalSupply, pfx]
  )

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardBGImage />
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Your PFX Breakdown</TYPE.white>
            <StyledClose stroke="white" onClick={() => setShowPfxBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <PfxTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.white fontSize={48} fontWeight={600} color="white">
                  {total?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">Balance:</TYPE.white>
                  <TYPE.white color="white">{pfxBalance?.toFixed(2, { groupSeparator: ',' })}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white color="white">Unclaimed:</TYPE.white>
                  <TYPE.white color="white">
                    {pfxToClaim?.toFixed(4, { groupSeparator: ',' })}{' '}
                    {pfxToClaim && pfxToClaim.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowPfxBalanceModal(false)} to="/pfx">
                        (claim)
                      </StyledInternalLink>
                    )}
                  </TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.white color="white">PFX price:</TYPE.white>
              <TYPE.white color="white">{pfxPrice?.toFixed(5) ?? '-'} AVAX</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white color="white">PFX in circulation:</TYPE.white>
              <TYPE.white color="white">{circulation?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white color="white">Total Supply</TYPE.white>
              <TYPE.white color="white">{totalSupply?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
            </RowBetween>
          </AutoColumn>
        </CardSection>
      </ModalUpper>
    </ContentWrapper>
  )
}
