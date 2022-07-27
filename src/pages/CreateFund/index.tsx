import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled, Container  } from '@mui/system'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { CustomButton } from '../../components/Button'
import CurrencyInputPanel from '../../components/createFund/CurrencyInputPanel'
import {
  useDefaultsFromURLSearch,
  useDepositActionHandlers,
  useDepositState,
} from 'state/deposit/hooks'

// const handleTokenSelect = useCallback(
//   (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
//   [onCurrencySelection]
// )



export default function CreateFund() {

  const { currency, typedValue, sender, fundAccount } = useDepositState()

  const { onCurrencySelection, onUserInput, onChangeSender } = useDepositActionHandlers()

  const handleCurrencySelect = useCallback(
    (currency : string) => {
      onCurrencySelection(currency)
    },
    [onCurrencySelection]
  )

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(value)
    },
    [onUserInput]
  )



  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={3}>
        <Box
          sx={{
            width: 500,
            height: 260,
            mt: 12,
            px:1,
            backgroundColor: 'success.main',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="button" display="block" gutterBottom sx={{ mt: 2 }}>
            Create a fund
          </Typography>
          <CurrencyInputPanel 
            value={typedValue}
            onUserInput={handleTypeInput}
            onCurrencySelect={handleCurrencySelect}
            currency={currency}
          />
          <CustomButton onClick={() => alert('click!')}>Button</CustomButton>
            
        </Box>
      </Grid>   
    </Grid> 

  );
}