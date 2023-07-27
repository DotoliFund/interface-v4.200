import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@uniswap/v3-sdk'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }

export const UNI_ADDRESS: AddressMap = constructSameAddressMap('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

//mainnet
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const DOTOLI_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0xFd78b26D1E5fcAC01ba43479a44afB69a8073716', [SupportedChainId.MAINNET]),
}
export const DOTOLI_STAKING_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x480E6993dA410D5026D7bD3652F53D99845B6fc3', [SupportedChainId.MAINNET]),
}
//export const DOTOLI_SETTING_ADDRESSES = '0x5E1cE0e492f956b4a1A1963E4A465256C060966c'
export const DOTOLI_INFO_ADDRESSES = '0xD72008394f456362765446aD8638a0B0ee226d70'
export const DOTOLI_FUND_ADDRESSES = '0x5EA02ce75D173f03C88831893C69724C3F38df5e'
export const VOTE_URL = 'https://www.tally.xyz/gov/dotoli3'

// //goerli testnet
// export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
// export const DOTOLI_ADDRESS: AddressMap = {
//   ...constructSameAddressMap('0x3CE9C63607A24785b83b3d6B3245846d402fB49b', [SupportedChainId.GOERLI]),
// }
// export const DOTOLI_STAKING_ADDRESS: AddressMap = {
//   ...constructSameAddressMap('0x9de8C22693BdBB31A005B50C0376aB917A4FCAb0', [SupportedChainId.GOERLI]),
// }
// export const DOTOLI_SETTING_ADDRESSES = '0x04e4351B57aD0362A1Ac82759617c221112c8a22'
// export const DOTOLI_INFO_ADDRESSES = '0xd8F93D42E2a57137Ae9A3bF89c88f05db15B2B2e'
// export const DOTOLI_FUND_ADDRESSES = '0x696BFdA5f07225ab2fE5B43B9AC1093D2E044D74'
// export const VOTE_URL = 'https://www.tally.xyz/gov/eip155:5:0xfbD4900923647c69941c0819B410E3e44c9d024B'

/* V3 Contract Addresses */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap(V3_FACTORY_ADDRESS, []),
}

export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', []),
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

export const TICK_LENS_ADDRESSES: AddressMap = {}
