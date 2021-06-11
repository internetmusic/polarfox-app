import { Currency, CAVAX, Token } from '@polarfox/sdk'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import AvaxLogo from '../../assets/images/avalanche_token_round.png'
import PfxLogo from '../../assets/images/pfx-logo.png'
import AkitaLogo from '../../assets/images/akita-logo.png'

import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import Logo from '../Logo'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (currency === CAVAX) return []

    if (currency instanceof Token) {
      if (currency.symbol === 'PFX') return []
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address)]
      }

      return [...uriLocations, getTokenLogoURL(currency.address)]
    }
    return []
  }, [currency, uriLocations])

  if (currency === CAVAX) {
    return <StyledEthereumLogo src={AvaxLogo} size={size} style={style} />
  }

  // TODO: Check the address to make sure this is not a fake PFX
  if (currency?.symbol === 'PFX') {
    return <StyledEthereumLogo src={PfxLogo} size={size} style={style} />
  }

  // TODO: Check the address to make sure this is not a fake AKITA / gAKITA
  if (currency?.symbol === 'AKITA' || currency?.symbol === 'gAKITA') {
    return <StyledEthereumLogo src={AkitaLogo} size={size} style={style} />
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
