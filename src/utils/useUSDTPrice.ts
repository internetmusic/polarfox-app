// TODO: Actually calculate price

import { ChainId, Currency, currencyEquals, JSBI, Price, WAVAX } from '@polarfox/sdk'
import { useMemo } from 'react'
import { USDT as USDT_ } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from './wrappedCurrency'

/**
 * Returns the price in USDT of the input currency
 * @param currency currency to compute the USDT price of
 */
export default function useUSDTPrice(currency?: Currency): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const USDT = chainId ? USDT_[chainId] : USDT_[ChainId.AVALANCHE]
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        chainId && wrapped && currencyEquals(WAVAX[chainId], wrapped) ? undefined : currency,
        chainId ? WAVAX[chainId] : undefined
      ],
      [wrapped?.equals(USDT) ? undefined : wrapped, chainId === ChainId.AVALANCHE ? USDT : undefined], // TODO: Update this to include other chain IDs
      [chainId ? WAVAX[chainId] : undefined, chainId === ChainId.AVALANCHE ? USDT : undefined]
    ],
    [chainId, currency, wrapped, USDT]
  )
  const [[avaxPairState, avaxPair], [usdtPairState, usdtPair], [usdtAvaxPairState, usdtAvaxPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle wavax/avax
    if (wrapped.equals(WAVAX[chainId])) {
      if (usdtPair) {
        const price = usdtPair.priceOf(WAVAX[chainId])
        return new Price(currency, USDT, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdt
    if (wrapped.equals(USDT)) {
      return new Price(USDT, USDT, '1', '1')
    }

    const avaxPairAVAXAmount = avaxPair?.reserveOf(WAVAX[chainId])
    const avaxPairAVAXUSDTValue: JSBI =
      avaxPairAVAXAmount && usdtAvaxPair
        ? usdtAvaxPair.priceOf(WAVAX[chainId]).quote(avaxPairAVAXAmount).raw
        : JSBI.BigInt(0)

    // all other tokens
    // first try the usdt pair
    if (usdtPairState === PairState.EXISTS && usdtPair && usdtPair.reserveOf(USDT).greaterThan(avaxPairAVAXUSDTValue)) {
      const price = usdtPair.priceOf(wrapped)
      return new Price(currency, USDT, price.denominator, price.numerator)
    }
    if (avaxPairState === PairState.EXISTS && avaxPair && usdtAvaxPairState === PairState.EXISTS && usdtAvaxPair) {
      if (usdtAvaxPair.reserveOf(USDT).greaterThan('0') && avaxPair.reserveOf(WAVAX[chainId]).greaterThan('0')) {
        const avaxUsdtPrice = usdtAvaxPair.priceOf(USDT)
        const currencyAvaxPrice = avaxPair.priceOf(WAVAX[chainId])
        const usdtPrice = avaxUsdtPrice.multiply(currencyAvaxPrice).invert()
        return new Price(currency, USDT, usdtPrice.denominator, usdtPrice.numerator)
      }
    }
    return undefined
  }, [
    chainId,
    currency,
    avaxPair,
    avaxPairState,
    usdtAvaxPair,
    usdtAvaxPairState,
    usdtPair,
    usdtPairState,
    wrapped,
    USDT
  ])
}
