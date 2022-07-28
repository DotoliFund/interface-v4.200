import * as React from 'react';


        // <Route path='/swap' element={<Swap />}/>
        // <Route path='/deposit' element={<Deposit />}/>
        // <Route path='/withdraw' element={<Withdraw />}/>




export default function Swap() {



  // // the callback to execute the swap
  // const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
  //   approvalOptimizedTrade,
  //   allowedSlippage,
  //   recipient,
  //   signatureData
  // )

  // const handleSwap = useCallback(() => {
  //   if (!swapCallback) {
  //     return
  //   }
  //   if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
  //     return
  //   }
  //   setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
  //   swapCallback()
  //     .then((hash) => {
  //       setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
  //       sendEvent({
  //         category: 'Swap',
  //         action: 'transaction hash',
  //         label: hash,
  //       })
  //       sendEvent({
  //         category: 'Swap',
  //         action:
  //           recipient === null
  //             ? 'Swap w/o Send'
  //             : (recipientAddress ?? recipient) === account
  //             ? 'Swap w/o Send + recipient'
  //             : 'Swap w/ Send',
  //         label: [
  //           approvalOptimizedTradeString,
  //           approvalOptimizedTrade?.inputAmount?.currency?.symbol,
  //           approvalOptimizedTrade?.outputAmount?.currency?.symbol,
  //           'MH',
  //         ].join('/'),
  //       })
  //     })
  //     .catch((error) => {
  //       setSwapState({
  //         attemptingTxn: false,
  //         tradeToConfirm,
  //         showConfirm,
  //         swapErrorMessage: error.message,
  //         txHash: undefined,
  //       })
  //     })
  // }, [
  //   swapCallback,
  //   priceImpact,
  //   tradeToConfirm,
  //   showConfirm,
  //   recipient,
  //   recipientAddress,
  //   account,
  //   approvalOptimizedTradeString,
  //   approvalOptimizedTrade?.inputAmount?.currency?.symbol,
  //   approvalOptimizedTrade?.outputAmount?.currency?.symbol,
  // ])



  return (
      <>

      </>
  )
}