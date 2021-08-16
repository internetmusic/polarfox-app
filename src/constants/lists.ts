// the Polarfox Default token list lives here
// TODO: Add Avalanche token lists
// export const FUJI_TOKEN_LIST =
//  'https://raw.githubusercontent.com/Polarfox-DEX/polarfox-token-lists/master/43113/fuji-token-list.json'

export const FUJI_TOKEN_LIST =
  'https://raw.githubusercontent.com/internetmusic/copyright-token-list/master/43113/fuji-token-list.json'

export const DEFAULT_TOKEN_LIST_URL = FUJI_TOKEN_LIST // TODO: Update

export const DEFAULT_LIST_OF_LISTS: string[] = [FUJI_TOKEN_LIST, DEFAULT_TOKEN_LIST_URL]

// TODO: Have the token lists based on chain ID. Given how the code is written, this might be difficult
