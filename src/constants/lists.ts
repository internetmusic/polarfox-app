// the Polarfox Default token list lives here
// TODO: Update this
export const DEFAULT_TOKEN_LIST_URL = 'https://raw.githubusercontent.com/pangolindex/tokenlists/main/aeb.tokenlist.json'
export const TOP_15_TOKEN_LIST = 'https://raw.githubusercontent.com/pangolindex/tokenlists/main/top15.tokenlist.json'
export const DEFI_TOKEN_LIST = 'https://raw.githubusercontent.com/pangolindex/tokenlists/main/defi.tokenlist.json'
export const STABLECOIN_TOKEN_LIST =
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/stablecoin.tokenlist.json'
export const FUJI_TOKEN_LIST =
  'https://raw.githubusercontent.com/Polarfox-DEX/polarfox-token-lists/master/43113/fuji-token-list.json'

export const DEFAULT_LIST_OF_LISTS: string[] = [
  TOP_15_TOKEN_LIST,
  DEFAULT_TOKEN_LIST_URL,
  DEFI_TOKEN_LIST,
  STABLECOIN_TOKEN_LIST,
  FUJI_TOKEN_LIST
]

// TODO: Have the token lists based on chain ID. Given how the code is written, this might be difficult
