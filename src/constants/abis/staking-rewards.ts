import { Interface } from '@ethersproject/abi'
// TODO: This should be in the core, not in the governance
import { abi as STAKING_REWARDS_ABI } from '@polarfox/core/build/StakingRewards.json'

const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)

export { STAKING_REWARDS_INTERFACE }
