import { FACTORY_ADDRESS as V2_FACTORY_ADDRESS } from '@uniswap/v2-sdk'
import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@uniswap/v3-sdk'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }

export const UNI_ADDRESS: AddressMap = constructSameAddressMap('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

export const V2_FACTORY_ADDRESSES: AddressMap = constructSameAddressMap(V2_FACTORY_ADDRESS)
export const V2_ROUTER_ADDRESS: AddressMap = constructSameAddressMap('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D')

//mainnet
// export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
// export const DOTOLI_ADDRESS: AddressMap = {
//   ...constructSameAddressMap('0x5D8aa1475Fb7A56229fafcB4e7F2B31264dc0C11', [SupportedChainId.MAINNET]),
// }
// export const DOTOLI_STAKING_ADDRESS: AddressMap = {
//   ...constructSameAddressMap('0x504912B686B474Ed956F90c8562Fd7bD8F09Ca02', [SupportedChainId.MAINNET]),
// }
// export const DOTOLI_SETTING_ADDRESSES = '0x883271c9ae70Ef10DDB303f4CEec6d98471F8F59'
// export const DOTOLI_INFO_ADDRESSES = '0x5F9f8177932673e8e8544a97d1c4D75A87660924'
// export const DOTOLI_FUND_ADDRESSES = '0xac0701e051542048d24e66ec24C252B1131AFC1d'

//goerli testnet
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const DOTOLI_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x3CE9C63607A24785b83b3d6B3245846d402fB49b', [SupportedChainId.GOERLI]),
}
export const DOTOLI_STAKING_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x9de8C22693BdBB31A005B50C0376aB917A4FCAb0', [SupportedChainId.GOERLI]),
}
export const DOTOLI_SETTING_ADDRESSES = '0x04e4351B57aD0362A1Ac82759617c221112c8a22'
export const DOTOLI_INFO_ADDRESSES = '0xd8F93D42E2a57137Ae9A3bF89c88f05db15B2B2e'
export const DOTOLI_FUND_ADDRESSES = '0x696BFdA5f07225ab2fE5B43B9AC1093D2E044D74'

export const VOTE_URL = 'https://www.tally.xyz/gov/eip155:5:0xfbD4900923647c69941c0819B410E3e44c9d024B'

/* V3 Contract Addresses */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap(V3_FACTORY_ADDRESS, []),
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xA5644E29708357803b5A882D272c41cC0dF92B34', []),
}

export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', []),
}

export const SWAP_ROUTER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', []),
}

/**
 * The oldest V0 governance address
 */
export const GOVERNANCE_ALPHA_V0_ADDRESSES: AddressMap = constructSameAddressMap(
  '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F'
)
/**
 * The older V1 governance address
 */
export const GOVERNANCE_ALPHA_V1_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6',
}
/**
 * The latest governor bravo that is currently admin of timelock
 */
export const GOVERNANCE_BRAVO_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
}

export const TIMELOCK_ADDRESS: AddressMap = constructSameAddressMap('0x1a9C8182C09F50C8318d769245beA52c32BE35BC')

export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0x090D4613473dEE047c3f2706764f49E0821D256e',
}

export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8',
}

export const QUOTER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', []),
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0xC36442b4a4522E871399CD717aBDD847Ab11FE88', []),
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.GOERLI]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
}

export const SOCKS_CONTROLLER_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x65770b5283117639760beA3F867b69b3697a91dd',
}

export const TICK_LENS_ADDRESSES: AddressMap = {}
