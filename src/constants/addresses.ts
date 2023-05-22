import { FACTORY_ADDRESS as V2_FACTORY_ADDRESS } from '@uniswap/v2-sdk'
import { FACTORY_ADDRESS as V3_FACTORY_ADDRESS } from '@uniswap/v3-sdk'

import { constructSameAddressMap } from '../utils/constructSameAddressMap'
import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }

export const UNI_ADDRESS: AddressMap = constructSameAddressMap('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

export const V2_FACTORY_ADDRESSES: AddressMap = constructSameAddressMap(V2_FACTORY_ADDRESS)

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
  ...constructSameAddressMap('0x3d50774C395CC57dB82205773feece325f154845', [SupportedChainId.GOERLI]),
}
export const DOTOLI_STAKING_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1686377D0656707DfCB7BF1d0435B964AB36cb2F', [SupportedChainId.GOERLI]),
}
//export const DOTOLI_SETTING_ADDRESSES = '0x6700CFcC692Ed84eF1d2DB1882461Aee1306C4f2'
export const DOTOLI_INFO_ADDRESSES = '0x342F633A0F701a5d19b5Bf8eB521eEEa77123611'
export const DOTOLI_FUND_ADDRESSES = '0xA1B963e469EaBFaB2549BeC6D760491b18676Bd2'

export const VOTE_URL = 'https://www.tally.xyz/gov/eip155:5:0xfbD4900923647c69941c0819B410E3e44c9d024B'

/* V3 Contract Addresses */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  ...constructSameAddressMap(V3_FACTORY_ADDRESS, []),
}

export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', []),
}

export const SWAP_ROUTER_ADDRESSES: AddressMap = {
  ...constructSameAddressMap('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', []),
}

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
