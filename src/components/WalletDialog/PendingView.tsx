import { Connector } from '@web3-react/types'
import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


export default function PendingView({
  connector,
  error = false,
  tryActivation,
  openOptions,
}: {
  connector: Connector
  error?: boolean
  tryActivation: (connector: Connector) => void
  openOptions: () => void
}) {

  // return (
  //   <>
  //     <Box sx={{ display: 'flex', witdh: 200, height: 200}} >
  //       <Paper variant="outlined" sx={{ p: 10 }}>
  //         <CircularProgress size={40}/>
  //       </Paper> 
  //     </Box>
  //   </>
  // )


  return (
    <>
      {error ? (
        <>
          <Typography>Error connecting</Typography>
          <Typography>
            The connection attempt failed. Please click try again and follow the steps to connect in your wallet.
          </Typography>
          <Button variant="contained" onClick={() => { tryActivation(connector) }}>
            <Typography>Try Again</Typography>
          </Button>
          <Button variant="contained" onClick={openOptions}>
            <Typography>Back to wallet selection</Typography>
          </Button>
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', witdh: 200, height: 200}} >
            <Paper variant="outlined" sx={{ p: 10 }}>
            <CircularProgress size={40}/>
              <Typography>Connecting...</Typography>
            </Paper> 
          </Box>
        </>
      )}
    </>
  )



  // return (
  //   <>
  //     {error ? (
  //       <ErrorGroup>
  //         <ThemedText.MediumHeader marginBottom={12}>
  //           <Trans>Error connecting</Trans>
  //         </ThemedText.MediumHeader>
  //         <ThemedText.Body fontSize={14} marginBottom={36} textAlign="center">
  //           <Trans>
  //             The connection attempt failed. Please click try again and follow the steps to connect in your wallet.
  //           </Trans>
  //         </ThemedText.Body>
  //         <ButtonPrimary
  //           $borderRadius="12px"
  //           padding="12px"
  //           onClick={() => {
  //             tryActivation(connector)
  //           }}
  //         >
  //           <Trans>Try Again</Trans>
  //         </ButtonPrimary>
  //         <ButtonEmpty width="fit-content" padding="0" marginTop={20}>
  //           <ThemedText.Link fontSize={12} onClick={openOptions}>
  //             <Trans>Back to wallet selection</Trans>
  //           </ThemedText.Link>
  //         </ButtonEmpty>
  //       </ErrorGroup>
  //     ) : (
  //       <>
  //         <ThemedText.Black fontSize={20} marginY={16}>
  //           <LoaderContainer>
  //             <Loader stroke="currentColor" size="32px" />
  //           </LoaderContainer>
  //           <Trans>Connecting...</Trans>
  //         </ThemedText.Black>
  //       </>
  //     )}
  //   </>
  // )
}