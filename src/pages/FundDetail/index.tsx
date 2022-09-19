import { Trans } from '@lingui/macro'
import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import DoughnutChart from 'components/Chart/DoughnutChart'
import LineChart from 'components/Chart/LineChart'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components/macro'

import { ButtonError, ButtonLight, ButtonYellow } from '../../components/Button'
import { BlueCard, OutlineCard, YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import Row, { RowBetween, RowFixed } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { useToggleWalletModal } from '../../state/application/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import { ExternalLink, ThemedText } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import {
  DynamicSection,
  MediumOnly,
  PageWrapper,
  ResponsiveTwoColumns,
  RightContainer,
  ScrollablePage,
  StackedContainer,
  StackedItem,
} from './styled'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

const Wrapper = styled.div<{ redesignFlag?: boolean }>`
  background-color: ${({ redesignFlag, theme }) => redesignFlag && theme.backgroundSurface};
  outline: ${({ redesignFlag, theme }) => redesignFlag && `1px solid ${theme.backgroundOutline}`};
  width: 100%;
  padding: 1rem;
`

export default function FundDetail() {
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const navigate = useNavigate()
  const {
    currencyIdA,
    currencyIdB,
    feeAmount: feeAmountFromUrl,
    tokenId,
  } = useParams<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>()
  const { account, chainId, provider } = useWeb3React()
  const theme = useTheme()
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled

  const toggleWalletModal = useToggleWalletModal() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const parsedQs = useParsedQueryString()

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined

  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // capital efficiency warning
  const [showCapitalEfficiencyWarning, setShowCapitalEfficiencyWarning] = useState(false)

  useEffect(() => setShowCapitalEfficiencyWarning(false), [baseCurrency, quoteCurrency, feeAmount])

  const [txHash, setTxHash] = useState<string>('')

  const argentWalletContract = useArgentWalletContract()

  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE)

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' ||
          (chainId !== undefined && currencyIdNew === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' ||
            (chainId !== undefined && currencyIdOther === WRAPPED_NATIVE_CURRENCY[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId]
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/add/${idA}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/add/${idB}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      // dont jump to pool page if creating
      navigate('/pool')
    }
    setTxHash('')
  }, [navigate, txHash])

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
    ) : (
      <AutoColumn gap={'md'}>
        {<RowBetween></RowBetween>}
        <ButtonError
          onClick={() => {
            setShowConfirm(true)
          }}
          disabled={false}
          error={false}
        >
          <Text fontWeight={500}>{<Trans>Preview</Trans>}</Text>
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
            positionID={'1234'}
            defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={true}
          ></AddRemoveTabs>

          <Wrapper>
            <ResponsiveTwoColumns wide={true}>
              <AutoColumn gap="lg">
                <RowBetween paddingBottom="20px">
                  <ThemedText.DeprecatedLabel>
                    <Trans>Select Pair</Trans>
                    <LineChart />
                  </ThemedText.DeprecatedLabel>
                </RowBetween>
                <RowBetween>
                  <div style={{ width: '12px' }} />
                </RowBetween>
              </AutoColumn>
              <div>
                <DynamicSection disabled={false}>
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedLabel>{<Trans>Deposit Amounts</Trans>}</ThemedText.DeprecatedLabel>
                  </AutoColumn>
                </DynamicSection>
              </div>

              <RightContainer gap="lg">
                <DynamicSection gap="md" disabled={!feeAmount}>
                  <AutoColumn gap="md">
                    <RowBetween>
                      <ThemedText.DeprecatedLabel>
                        <Trans>Set Starting Price</Trans>
                        <DoughnutChart />
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

                    <OutlineCard padding="12px"></OutlineCard>
                    <RowBetween
                      style={{ backgroundColor: theme.deprecated_bg1, padding: '12px', borderRadius: '12px' }}
                    >
                      <ThemedText.DeprecatedMain>
                        <Trans>Current {baseCurrency?.symbol} Price:</Trans>
                      </ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedMain>{'-'}</ThemedText.DeprecatedMain>
                    </RowBetween>
                  </AutoColumn>
                </DynamicSection>

                <DynamicSection gap="md" disabled={!feeAmount}>
                  <StackedContainer>
                    <StackedItem style={{ opacity: showCapitalEfficiencyWarning ? '0.05' : 1 }}>
                      <AutoColumn gap="md">
                        <RowBetween>
                          <ThemedText.DeprecatedLabel>
                            <Trans>Set Price Range</Trans>
                          </ThemedText.DeprecatedLabel>
                        </RowBetween>
                      </AutoColumn>
                    </StackedItem>

                    {showCapitalEfficiencyWarning && (
                      <StackedItem zIndex={1}>
                        <YellowCard
                          padding="15px"
                          $borderRadius="12px"
                          height="100%"
                          style={{
                            borderColor: theme.deprecated_yellow3,
                            border: '1px solid',
                          }}
                        >
                          <AutoColumn gap="8px" style={{ height: '100%' }}>
                            <RowFixed>
                              <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                              <ThemedText.DeprecatedYellow ml="12px" fontSize="15px">
                                <Trans>Efficiency Comparison</Trans>
                              </ThemedText.DeprecatedYellow>
                            </RowFixed>
                            <RowFixed>
                              <ThemedText.DeprecatedYellow ml="12px" fontSize="13px" margin={0} fontWeight={400}>
                                <Trans>
                                  Full range positions may earn less fees than concentrated positions. Learn more{' '}
                                  <ExternalLink
                                    style={{ color: theme.deprecated_yellow3, textDecoration: 'underline' }}
                                    href={
                                      'https://help.uniswap.org/en/articles/5434296-can-i-provide-liquidity-over-the-full-range-in-v3'
                                    }
                                  >
                                    here
                                  </ExternalLink>
                                  .
                                </Trans>
                              </ThemedText.DeprecatedYellow>
                            </RowFixed>
                            <Row>
                              <ButtonYellow
                                padding="8px"
                                marginRight="8px"
                                $borderRadius="8px"
                                width="auto"
                                redesignFlag={redesignFlagEnabled}
                                onClick={() => {
                                  setShowCapitalEfficiencyWarning(false)
                                }}
                              >
                                <ThemedText.DeprecatedBlack fontSize={13} color="black">
                                  <Trans>I understand</Trans>
                                </ThemedText.DeprecatedBlack>
                              </ButtonYellow>
                            </Row>
                          </AutoColumn>
                        </YellowCard>
                      </StackedItem>
                    )}
                  </StackedContainer>
                </DynamicSection>

                <MediumOnly>
                  <Buttons />
                </MediumOnly>
              </RightContainer>
            </ResponsiveTwoColumns>
          </Wrapper>
        </PageWrapper>
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
