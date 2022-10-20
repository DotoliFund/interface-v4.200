import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { XXXFACTORY_ADDRESSES } from 'constants/addresses'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { useXXXFactoryContract } from 'hooks/useContract'
import { XXXFactory } from 'interface/XXXFactory'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useTheme } from 'styled-components/macro'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { ButtonError, ButtonLight } from '../../components/Button'
import { BlueCard } from '../../components/Card'
import DoughnutChart from '../../components/Chart/DoughnutChart'
import LineChart from '../../components/Chart/LineChart'
import { AutoColumn } from '../../components/Column'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import Row, { RowBetween } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { useToggleWalletModal } from '../../state/application/hooks'
import { ThemedText } from '../../theme'
import {
  DynamicSection,
  PageWrapper,
  ResponsiveTwoColumns,
  RightContainer,
  ScrollablePage,
  StackedContainer,
  StackedItem,
  Wrapper,
} from './styled'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function Fund() {
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const XXXFactoryContract = useXXXFactoryContract()
  const navigate = useNavigate()

  const { account, chainId, provider } = useWeb3React()
  const theme = useTheme()
  const { fundAddress } = useParams<{ fundAddress?: string }>()

  function switchToMyAccount() {
    alert(1234)
    //navigate(`/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`)
    //navigate(`/fund/:fundAddress/:account/`)
  }
  function switchToFundAccount() {
    alert(5678)
    //navigate(`/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`)
    //navigate(`/fund/:fundAddress`)
  }

  const { loading: managingFundLoading, result: [managingFund] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [account ?? undefined]
  )

  const { loading: isSubscribeLoading, result: [isSubscribe] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'isSubscribed',
    [account ?? undefined, fundAddress ?? undefined]
  )

  async function onSubscribe() {
    if (!chainId || !provider || !account || !fundAddress) return
    const { calldata, value } = XXXFactory.subscribeCallParameters(fundAddress)
    const txn: { to: string; data: string; value: string } = {
      to: XXXFACTORY_ADDRESSES,
      data: calldata,
      value,
    }
    provider
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return provider
          .getSigner()
          .sendTransaction(newTxn)
          .then((response) => {
            console.log(response)
          })
      })
      .catch((error) => {
        //setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const toggleWalletModal = useToggleWalletModal() // toggle wallet when disconnected

  const Buttons = () =>
    !account ? (
      <TraceEvent
        events={[Event.onClick]}
        name={EventName.CONNECT_WALLET_BUTTON_CLICKED}
        properties={{ received_swap_quote: false }}
        element={ElementName.CONNECT_WALLET_BUTTON}
      >
        <ButtonLight onClick={toggleWalletModal} $borderRadius="12px" padding={'12px'}>
          <Trans>Connect Wallet</Trans>
        </ButtonLight>
      </TraceEvent>
    ) : managingFundLoading || isSubscribeLoading ? (
      <AutoColumn gap={'md'}>
        <ButtonError disabled={true}>
          <Text fontWeight={500}>
            <Trans>Loading...</Trans>
          </Text>
        </ButtonError>
      </AutoColumn>
    ) : managingFund?.at(0).toUpperCase() === fundAddress?.toUpperCase() && !isSubscribe ? (
      <AutoColumn gap={'md'}>
        <ButtonError
          onClick={() => {
            navigate(`/fund/${fundAddress}/${account}`)
          }}
          disabled={false}
        >
          <Text fontWeight={500}>
            <Trans>My Account : {account}</Trans>
          </Text>
        </ButtonError>
      </AutoColumn>
    ) : managingFund.toUpperCase() !== fundAddress?.toUpperCase() && isSubscribe ? (
      <AutoColumn gap={'md'}>
        <ButtonError
          onClick={() => {
            navigate(`/fund/${fundAddress}/${account}`)
          }}
          disabled={false}
        >
          <Text fontWeight={500}>
            <Trans>My Account : {account}</Trans>
          </Text>
        </ButtonError>
      </AutoColumn>
    ) : managingFund.toUpperCase() !== fundAddress?.toUpperCase() && !isSubscribe ? (
      <AutoColumn gap={'md'}>
        <ButtonError
          onClick={() => {
            onSubscribe()
          }}
          disabled={false}
        >
          <Text fontWeight={500}>
            <Trans>Subscribe</Trans>
          </Text>
        </ButtonError>
      </AutoColumn>
    ) : (
      <AutoColumn gap={'md'}>
        <ButtonError disabled={true}>
          <Text fontWeight={500}>
            <Trans>Unexpected Error</Trans>
          </Text>
        </ButtonError>
      </AutoColumn>
    )

  return (
    <>
      <ScrollablePage navBarFlag={navBarFlagEnabled}>
        <PageWrapper wide={true}>
          <AddRemoveTabs
            creating={false}
            adding={true}
            positionID={'test1234'}
            defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={true}
          >
            <Row justifyContent="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
              <ToggleWrapper width="fit-content">
                <ToggleElement
                  isActive={true}
                  fontSize="14px"
                  onClick={() => {
                    switchToMyAccount()
                  }}
                >
                  <Trans>My Account</Trans>
                </ToggleElement>
                <ToggleElement
                  isActive={false}
                  fontSize="14px"
                  onClick={() => {
                    switchToFundAccount()
                  }}
                >
                  <Trans>Fund Account</Trans>
                </ToggleElement>
              </ToggleWrapper>
            </Row>
          </AddRemoveTabs>
          <Wrapper>
            <ResponsiveTwoColumns wide={true}>
              <AutoColumn gap="lg">
                <RowBetween paddingBottom="20px">
                  <ThemedText.DeprecatedLabel>
                    <Trans>Select Pair</Trans>
                    <Wrapper>
                      <LineChart />
                    </Wrapper>
                  </ThemedText.DeprecatedLabel>
                </RowBetween>
              </AutoColumn>
              <AutoColumn gap="lg">
                <RowBetween paddingBottom="20px">
                  <ThemedText.DeprecatedLabel>
                    <Trans>Select Pair2</Trans>
                    <Wrapper>
                      <LineChart />
                    </Wrapper>
                  </ThemedText.DeprecatedLabel>
                </RowBetween>
              </AutoColumn>
              {/* <div>
                <DynamicSection disabled={false}>
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedLabel>
                      <Trans>Deposit Amounts</Trans>
                      <DoughnutChart />
                    </ThemedText.DeprecatedLabel>
                  </AutoColumn>
                </DynamicSection>
              </div> */}
              <RightContainer gap="lg">
                <DynamicSection gap="md" disabled={true}>
                  <AutoColumn gap="md">
                    <RowBetween>
                      <ThemedText.DeprecatedLabel>
                        <DoughnutChart />
                        <Trans>Set Starting Price</Trans>
                      </ThemedText.DeprecatedLabel>
                    </RowBetween>

                    <BlueCard
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '1rem 1rem',
                      }}
                    >
                      <ThemedText.DeprecatedBody
                        fontSize={14}
                        style={{ fontWeight: 500 }}
                        textAlign="left"
                        color={theme.deprecated_primaryText1}
                      >
                        <Trans>
                          This pool must be initialized before you can add liquidity. To initialize, select a starting
                          price for the pool. Then, enter your liquidity price range and deposit amount. Gas fees will
                          be higher than usual due to the initialization transaction.
                        </Trans>
                      </ThemedText.DeprecatedBody>
                    </BlueCard>
                    <RowBetween
                      style={{ backgroundColor: theme.deprecated_bg1, padding: '12px', borderRadius: '12px' }}
                    >
                      <ThemedText.DeprecatedMain>
                        <Trans>Current Price:</Trans>
                      </ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedMain>{'-'}</ThemedText.DeprecatedMain>
                    </RowBetween>
                  </AutoColumn>
                </DynamicSection>

                <DynamicSection gap="md" disabled={true}>
                  <StackedContainer>
                    <StackedItem style={{ opacity: 1 }}>
                      <AutoColumn gap="md">
                        <RowBetween>
                          <ThemedText.DeprecatedLabel>
                            <Trans>Set Price Range</Trans>
                          </ThemedText.DeprecatedLabel>
                        </RowBetween>
                      </AutoColumn>
                    </StackedItem>
                  </StackedContainer>
                </DynamicSection>
              </RightContainer>
              <Buttons />
            </ResponsiveTwoColumns>
          </Wrapper>
        </PageWrapper>
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
