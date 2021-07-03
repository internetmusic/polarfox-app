import { JSBI, Token, TokenAmount } from '@polarfox/sdk'
import { BigNumber } from 'ethers'

const TREASURY_VESTING_GENESIS = 1612899125 // TODO: Update

const FOUR_YEARS: number = 60 * 60 * 24 * 365 * 4
const TREASURY_BEGIN_PERIOD_1 = TREASURY_VESTING_GENESIS
const TREASURY_END_YEAR_1 = TREASURY_BEGIN_PERIOD_1 + FOUR_YEARS

const TREASURY_BEGIN_PERIOD_2 = TREASURY_END_YEAR_1
const TREASURY_END_YEAR_2 = TREASURY_BEGIN_PERIOD_2 + FOUR_YEARS

const TREASURY_BEGIN_PERIOD_3 = TREASURY_END_YEAR_2
const TREASURY_END_YEAR_3 = TREASURY_BEGIN_PERIOD_3 + FOUR_YEARS

const TREASURY_BEGIN_PERIOD_4 = TREASURY_END_YEAR_3
const TREASURY_END_YEAR_4 = TREASURY_BEGIN_PERIOD_4 + FOUR_YEARS

const PRESALE_AMOUNT = 9_250_000 // TODO: Update
const TREASURY_PERIOD_1_AMOUNT = 256_000_000 // TODO: Update
const TREASURY_PERIOD_2_AMOUNT = 128_000_000 // TODO: Update
const TREASURY_PERIOD_3_AMOUNT = 64_000_000 // TODO: Update
const TREASURY_PERIOD_4_AMOUNT = 32_000_000 // TODO: Update

function withVesting(before: JSBI, time: BigNumber, amount: number, start: number, end: number, cliff?: number) {
  if (time.gt(start)) {
    if (time.gte(end)) {
      return JSBI.add(before, JSBI.BigInt(amount))
    } else {
      if ((typeof cliff === 'number' && time.gte(cliff)) || typeof cliff === 'undefined') {
        const endStartDifference = JSBI.subtract(JSBI.BigInt(end), JSBI.BigInt(start))

        if (JSBI.equal(endStartDifference, JSBI.BigInt(0)))
          console.warn('endStartDifference is zero, withVesting will be wrong')

        return JSBI.add(
          before,
          JSBI.divide(JSBI.multiply(JSBI.BigInt(amount), JSBI.BigInt(time.sub(start).toString())), endStartDifference)
        )
      }
    }
  }
  return before
}

// TODO: Make sure this works
export function computePfxCirculation(pfx: Token, blockTimestamp: BigNumber): TokenAmount {
  let wholeAmount = JSBI.BigInt(PRESALE_AMOUNT)

  // treasury vesting
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_PERIOD_1_AMOUNT,
    TREASURY_BEGIN_PERIOD_1,
    TREASURY_END_YEAR_1
  )
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_PERIOD_2_AMOUNT,
    TREASURY_BEGIN_PERIOD_2,
    TREASURY_END_YEAR_2
  )
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_PERIOD_3_AMOUNT,
    TREASURY_BEGIN_PERIOD_3,
    TREASURY_END_YEAR_3
  )
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_PERIOD_4_AMOUNT,
    TREASURY_BEGIN_PERIOD_4,
    TREASURY_END_YEAR_4
  )

  return new TokenAmount(pfx, JSBI.multiply(wholeAmount, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))))
}
