import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { CustomButton } from 'components/Button2'
import { useCurrency } from 'hooks/Tokens'
import { useAllTokens } from 'hooks/Tokens'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
//import { useToggleWalletModal } from 'state/application/hooks'
import { useSwapCallback } from 'hooks/useSwapCallback'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'

export default function FundSwap() {
  const name0 = 'Wrapped Ether'
  const symbol0 = 'WETH'
  const decimals0 = 18
  const address0 = '0xc778417e063141139fce010982780140aa0cd5ab'

  const name1 = 'Uniswap Token'
  const symbol1 = 'UNI'
  const decimals1 = 18
  const address1 = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

  const { account, chainId, provider } = useWeb3React()

  const allTokens = useAllTokens()
  //console.log(allTokens)

  let inputCurrency = useCurrency(address0)
  let outputCurrency = useCurrency(address1)

  //console.log(inputCurrency)
  //console.log(outputCurrency)

  if (!inputCurrency) {
    inputCurrency = undefined
  }
  if (!outputCurrency) {
    outputCurrency = undefined
  }
  const typedValue = '0.2'

  const parsedAmount = tryParseCurrencyAmount(typedValue, inputCurrency)

  const trade = useBestTrade(TradeType.EXACT_INPUT, parsedAmount, outputCurrency)
  // allowed slippage is either auto slippage, or custom user defined slippage if auto slippage disabled
  const autoSlippageTolerance = useAutoSlippageTolerance(trade.trade)
  const allowedSlippage = useUserSlippageToleranceWithDefault(autoSlippageTolerance)

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade.trade,
    allowedSlippage,
    '0xAC8fa658D92eB97D92c145774d103f4D9578da16',
    '0xAC8fa658D92eB97D92c145774d103f4D9578da16'
  )

  function handleSwap() {
    console.log(1)
    if (!account) {
      console.log('account is null')
      return
    }
    console.log(2)

    if (!swapCallback) {
      return
    }
    // if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
    //   return
    // }
    //setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    console.log(3)
    swapCallback()
      .then((hash) => {
        console.log(4)
        console.log(hash)
        //setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
        // sendEvent({
        //   category: 'Swap',
        //   action: 'transaction hash',
        //   label: hash,
        // })
        // sendEvent({
        //   category: 'Swap',
        //   action:
        //     recipient === null
        //       ? 'Swap w/o Send'
        //       : (recipientAddress ?? recipient) === account
        //       ? 'Swap w/o Send + recipient'
        //       : 'Swap w/ Send',
        //   label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
        //     '/'
        //   ),
        // })
      })
      .catch((error) => {
        // setSwapState({
        //   attemptingTxn: false,
        //   tradeToConfirm,
        //   showConfirm,
        //   swapErrorMessage: error.message,
        //   txHash: undefined,
        // })
      })
  }

  return (
    <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
      <Grid item xs={3}>
        <Box
          sx={{
            width: 500,
            height: 260,
            mt: 12,
            px: 1,
            backgroundColor: 'success.main',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="button" display="block" gutterBottom sx={{ mt: 2 }}>
            Swap
          </Typography>

          <CustomButton onClick={() => handleSwap()}>Swap</CustomButton>
        </Box>
      </Grid>
    </Grid>
  )
}
