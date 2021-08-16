import { ChainId, JSBI, Percent, Token, WAVAX } from '@polarfox/sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'

import { injected } from '../connectors'

export const GAS_PRICE = 225

export const ROUTER_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.FUJI]: '0xe84f91A624D4625a7acE364d1E2564Efa735DB21',
  [ChainId.AVALANCHE]: '' // TODO: Add
}

export const LANDING_PAGE = 'https://swap.copyrightspool.com/'
export const ANALYTICS_PAGE = 'https://Copyrightflow.com/'
export const FORUM_PAGE = 'https://copyrightcoins.com/'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const PFX_GOVERNANCE_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.FUJI]: '0xad3CB8d7B31b2f9619Fe82ae93DF5C041fFf87cE', // !! TODO Update
  [ChainId.AVALANCHE]: '' // TODO: Add
}

export const AKITA_GOVERNANCE_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.FUJI]: '0xd848A6A81769b8829a3dbaD27Ba0EAA74BC0b12b', // !! TODO Update
  [ChainId.AVALANCHE]: '' // TODO: Add
}

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const PFX: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0xAA9344D903ef9034612e8221C0e0eF3B744A42BF', 18, 'PFX', 'Polarfox'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'PFX', 'Polarfox') // TODO: Wrong address, must update
}

export const AKITA: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0xFf2Ebd79c0948C8fE69b96434915ABC03Ebb5c37', 18, 'AKITA', 'Akita Inu'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'AKITA', 'Akita Inu') // TODO: Wrong address, must update
}

export const gAKITA: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    '0x8BAb1Be3571a54e8dB6b975eb39ceDE251A1C6dF',
    18,
    'gAKITA',
    'Akita Inu Governance Token'
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    ZERO_ADDRESS, // TODO: Wrong address, must update
    18,
    'gAKITA',
    'Akita Inu Governance Token'
  )
}

// Test tokens
export const TEST1: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0x8106a9048c6B8AFeE3Bad165547b439307Adf734', 18, 'TEST1', 'Test 1'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'TEST1', 'Test 1')
}

export const TEST2: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0xca07bBc5a033557Bca31e4f550ADBEb65c2BbB45', 18, 'TEST2', 'Test 2'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'TEST2', 'Test 2')
}

export const TEST3: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0x064649130266E3e3a95079F169F6dBd6d8602FD6', 18, 'TEST3', 'Test 3'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'TEST3', 'Test 3')
}

export const WETH: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0x598d84C62B6a9Af2FcF6DA1D9Bff52f9dd7D8226', 18, 'WETH', 'Wrapped Ether'), // TODO: Wrong address, must update
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'USDT', 'Tether USD') // TODO: Wrong address, must update
}

export const USDT: { [chainId in ChainId]: Token } = {
  [ChainId.FUJI]: new Token(ChainId.FUJI, '0x8E18dEF819C5C50937e883dD9ecc5B6783224aC7', 18, 'USDT', 'Tether USD'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, ZERO_ADDRESS, 18, 'USDT', 'Tether USD') // TODO: Wrong address, must update
}

const WAVAX_ONLY: ChainTokenList = {
  [ChainId.FUJI]: [WAVAX[ChainId.FUJI]],
  [ChainId.AVALANCHE]: [WAVAX[ChainId.AVALANCHE]]
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WAVAX_ONLY,
  [ChainId.FUJI]: [...WAVAX_ONLY[ChainId.FUJI]],
  [ChainId.AVALANCHE]: [...WAVAX_ONLY[ChainId.AVALANCHE]]
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.FUJI]: {},
  [ChainId.AVALANCHE]: {}
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WAVAX_ONLY,
  [ChainId.FUJI]: [...WAVAX_ONLY[ChainId.FUJI]],
  [ChainId.AVALANCHE]: [...WAVAX_ONLY[ChainId.AVALANCHE]]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WAVAX_ONLY,
  [ChainId.FUJI]: [...WAVAX_ONLY[ChainId.FUJI]],
  [ChainId.AVALANCHE]: [...WAVAX_ONLY[ChainId.AVALANCHE]]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.FUJI]: [],
  [ChainId.AVALANCHE]: []
}

export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  }
}

export const NetworkContextName = 'NETWORK'

export const AVALANCHE_CHAIN_PARAMS = {
  chainId: '0xa86a', // A 0x-prefixed hexadecimal chainId
  chainName: 'Avalanche Mainnet C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://cchain.explorer.avax.network/']
}

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 60 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 60

export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
export const BETTER_TRADE_LINK_THRESHOLD = new Percent(JSBI.BigInt(75), JSBI.BigInt(10000))
