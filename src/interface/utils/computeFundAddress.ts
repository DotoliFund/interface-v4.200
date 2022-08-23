import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { FUND_INIT_CODE_HASH } from './constants'

/**
 * Computes a fund address
 * @param factoryAddress The XXXFund factory address
 * @param manager creater of fund
 * @param initCodeHashManualOverride Override the init code hash used to compute the fund address if necessary
 * @returns The fund address
 */
export function computeFundAddress(
  factoryAddress: string,
  manager: string,
  initCodeHashManualOverride?: string
): string {
  return getCreate2Address(
    factoryAddress,
    keccak256(
      ['bytes'],
      [defaultAbiCoder.encode(['address', 'address'], [factoryAddress, manager])]
    ),
    initCodeHashManualOverride ?? FUND_INIT_CODE_HASH
  )
}