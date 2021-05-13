import { ChainId } from '@polarfox/sdk'
import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.FUJI]: '0xF39CC7d04f8ced8B05f2730602f94B9044Da0e0B',
  [ChainId.AVALANCHE]: '0x0FB54156B496b5a040b51A71817aED9e2927912E' // TODO: update this
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
