import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getConnection, getConnectionName, getIsMetaMask } from 'connection/utils'
import { Context, useCallback, useContext } from 'react'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { isMobile } from 'utils/userAgent'

//import { clearAllTransactions } from '../../state/transactions/reducer'
import { shortenAddress } from '../../utils'
//import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
// import Transaction from './Transaction'


import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import PersonIcon from '@mui/icons-material/Person';
import { blue } from '@mui/material/colors';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import * as React from 'react';
import Chip from '@mui/material/Chip';


// function renderTransactions(transactions: string[]) {
//   return (
//     <TransactionListWrapper>
//       {transactions.map((hash, i) => {
//         return <Transaction key={i} hash={hash} />
//       })}
//     </TransactionListWrapper>
//   )
// }

interface AccountDetailsProps {
  toggleWalletModal: () => void
  pendingTransactions: string[]
  confirmedTransactions: string[]
  ENSName?: string
  openOptions: () => void
}

export default function AccountDetails({
  ENSName
} : { 
  ENSName?: string
}) {
  const { chainId, account, connector } = useWeb3React()
  const connectionType = getConnection(connector).type

  const dispatch = useAppDispatch()

  const isMetaMask = getIsMetaMask()
  const isInjectedMobileBrowser = isMetaMask && isMobile

  // function formatConnectorName() {
  //   return (
  //     <WalletName>
  //       <Trans>Connected with</Trans> {getConnectionName(connectionType, isMetaMask)}
  //     </WalletName>
  //   )
  // }

  // const clearAllTransactionsCallback = useCallback(() => {
  //   if (chainId) dispatch(clearAllTransactions({ chainId }))
  // }, [dispatch, chainId])


  return (
    <>  
      <Box
        sx={{
          display: 'flex',
          width: 450,
          height: 140,
        }}
      >
        <Paper variant="outlined" sx={{ mx: 2, mb: 2 }}>
          <Grid container spacing={1}>
            <Grid container item spacing={1} sx={{ mt: 0.5, mx: 0.5 }}>
              <Grid item xs={6}>
                <Typography sx={{ m: 0.5, fontSize: 13 }}>Connected with Metamask</Typography>
              </Grid>
              <Grid item xs={3}>
                <Chip sx={{ height: 23, fontSize: 13 }} label="Disconnect" variant="outlined" onClick={()=>alert()} />
              </Grid>
              <Grid item xs={3}>
                <Chip sx={{ height: 23, fontSize: 13 }} label="Change" variant="outlined" onClick={()=>alert()} />
              </Grid>
            </Grid>
            <Grid container item spacing={2} sx={{ ml: 0.1 }}>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: 20 }}>0x3464kj5k4k5jk</Typography>
              </Grid>
            </Grid>
            <Grid container item spacing={1} sx={{ mb: 0.5, mx: 0.5 }}>
              <Grid item xs={6}>
                <Typography sx={{ m: 0.5, fontSize: 13 }}>Copy Address</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ m: 0.5, fontSize: 13 }}>View on Explorer</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Paper>     
      </Box>
      <Divider />
      <Box
        sx={{
          display: 'flex',
          width: 450,
          height: 50,
        }}
      >
        <Typography>test 123</Typography>
      </Box>
    </>
  )







  // return (
  //   <>
  //     <UpperSection>
  //       <CloseIcon onClick={toggleWalletModal}>
  //         <CloseColor />
  //       </CloseIcon>
  //       <HeaderRow>
  //         <Trans>Account</Trans>
  //       </HeaderRow>
  //       <AccountSection>
  //         <YourAccount>
  //           <InfoCard>
  //             <AccountGroupingRow>
  //               {formatConnectorName()}
  //               <div>
  //                 {!isInjectedMobileBrowser && (
  //                   <>
  //                     <WalletAction
  //                       style={{ fontSize: '.825rem', fontWeight: 400, marginRight: '8px' }}
  //                       onClick={() => {
  //                         if (connector.deactivate) {
  //                           connector.deactivate()
  //                         } else {
  //                           connector.resetState()
  //                         }

  //                         dispatch(updateSelectedWallet({ wallet: undefined }))
  //                         openOptions()
  //                       }}
  //                     >
  //                       <Trans>Disconnect</Trans>
  //                     </WalletAction>
  //                     <WalletAction
  //                       style={{ fontSize: '.825rem', fontWeight: 400 }}
  //                       onClick={() => {
  //                         openOptions()
  //                       }}
  //                     >
  //                       <Trans>Change</Trans>
  //                     </WalletAction>
  //                   </>
  //                 )}
  //               </div>
  //             </AccountGroupingRow>
  //             <AccountGroupingRow data-testid="web3-account-identifier-row">
  //               <AccountControl>
  //                 <div>
  //                   <StatusIcon connectionType={connectionType} />
  //                   <p>{ENSName ? ENSName : account && shortenAddress(account)}</p>
  //                 </div>
  //               </AccountControl>
  //             </AccountGroupingRow>
  //             <AccountGroupingRow>
  //               {ENSName ? (
  //                 <>
  //                   <AccountControl>
  //                     <div>
  //                       {account && (
  //                         <CopyHelper toCopy={account} iconPosition="left">
  //                           <span style={{ marginLeft: '4px' }}>
  //                             <Trans>Copy Address</Trans>
  //                           </span>
  //                         </CopyHelper>
  //                       )}
  //                       {chainId && account && (
  //                         <AddressLink
  //                           hasENS={!!ENSName}
  //                           isENS={true}
  //                           href={getExplorerLink(chainId, ENSName, ExplorerDataType.ADDRESS)}
  //                         >
  //                           <LinkIcon size={16} />
  //                           <span style={{ marginLeft: '4px' }}>
  //                             <Trans>View on Explorer</Trans>
  //                           </span>
  //                         </AddressLink>
  //                       )}
  //                     </div>
  //                   </AccountControl>
  //                 </>
  //               ) : (
  //                 <>
  //                   <AccountControl>
  //                     <div>
  //                       {account && (
  //                         <CopyHelper toCopy={account} iconPosition="left">
  //                           <span style={{ marginLeft: '4px' }}>
  //                             <Trans>Copy Address</Trans>
  //                           </span>
  //                         </CopyHelper>
  //                       )}
  //                       {chainId && account && (
  //                         <AddressLink
  //                           hasENS={!!ENSName}
  //                           isENS={false}
  //                           href={getExplorerLink(chainId, account, ExplorerDataType.ADDRESS)}
  //                         >
  //                           <LinkIcon size={16} />
  //                           <span style={{ marginLeft: '4px' }}>
  //                             <Trans>View on Explorer</Trans>
  //                           </span>
  //                         </AddressLink>
  //                       )}
  //                     </div>
  //                   </AccountControl>
  //                 </>
  //               )}
  //             </AccountGroupingRow>
  //           </InfoCard>
  //         </YourAccount>
  //       </AccountSection>
  //     </UpperSection>
  //     {!!pendingTransactions.length || !!confirmedTransactions.length ? (
  //       <LowerSection>
  //         <AutoRow mb={'1rem'} style={{ justifyContent: 'space-between' }}>
  //           <ThemedText.Body>
  //             <Trans>Recent Transactions</Trans>
  //           </ThemedText.Body>
  //           <LinkStyledButton onClick={clearAllTransactionsCallback}>
  //             <Trans>(clear all)</Trans>
  //           </LinkStyledButton>
  //         </AutoRow>
  //         {renderTransactions(pendingTransactions)}
  //         {renderTransactions(confirmedTransactions)}
  //       </LowerSection>
  //     ) : (
  //       <LowerSection>
  //         <ThemedText.Body color={theme.text1}>
  //           <Trans>Your transactions will appear here...</Trans>
  //         </ThemedText.Body>
  //       </LowerSection>
  //     )}
  //   </>
  // )
}