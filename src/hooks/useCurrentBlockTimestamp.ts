import { BigNumber } from '@ethersproject/bignumber'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { useInterfaceMulticall } from './useContract'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): BigNumber | undefined {
  //TODO change function do not use multicall, use provider
// await provider.getBlock(100004)
// {
//   _difficulty: { BigNumber: "3849295379889" },
//   difficulty: 3849295379889,
//   extraData: '0x476574682f76312e302e312d39383130306634372f6c696e75782f676f312e34',
//   gasLimit: { BigNumber: "3141592" },
//   gasUsed: { BigNumber: "21000" },
//   hash: '0xf93283571ae16dcecbe1816adc126954a739350cd1523a1559eabeae155fbb63',
//   miner: '0x909755D480A27911cB7EeeB5edB918fae50883c0',
//   nonce: '0x1a455280001cc3f8',
//   number: 100004,
//   parentHash: '0x73d88d376f6b4d232d70dc950d9515fad3b5aa241937e362fdbfd74d1c901781',
//   timestamp: 1439799168,
//   transactions: [
//     '0x6f12399cc2cb42bed5b267899b08a847552e8c42a64f5eb128c1bcbd1974fb0c'
//   ]
// }
  return undefined
  const multicall = useInterfaceMulticall()
  const resultStr: string | undefined = useSingleCallResult(
    multicall,
    'getCurrentBlockTimestamp'
  )?.result?.[0]?.toString()
  return useMemo(() => (typeof resultStr === 'string' ? BigNumber.from(resultStr) : undefined), [resultStr])
}