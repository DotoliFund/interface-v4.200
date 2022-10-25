import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonConfirmed, ButtonError, ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel/StakingCurrencyInputPanel'
import Loader from 'components/Loader'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { AutoRow } from 'components/Row'
import { PageWrapper, SwapWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { Label } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { XXX_ADDRESS, XXXSTAKING2_ADDRESS } from 'constants/addresses'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { XXXStaking2 } from 'interface/XXXStaking2'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle, HelpCircle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useDefaultsFromURLSearch } from 'state/deposit/hooks'
import { useStakingInfo } from 'state/stake/hooks'
import { Field } from 'state/swap/actions'
import { useExpertModeManager } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { XXX } from '../../constants/tokens'

const BottomWrapper = styled.div<{ redesignFlag: boolean }>`
  ${({ redesignFlag }) =>
    redesignFlag &&
    css`
      background-color: ${({ theme }) => theme.backgroundModule};
      border-radius: 12px;
      padding: 8px 12px 10px;
      color: ${({ theme }) => theme.textSecondary};
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
    `}
`
const TopInputWrapper = styled.div<{ redesignFlag: boolean }>`
  padding: ${({ redesignFlag }) => redesignFlag && '0px 12px'};
  visibility: ${({ redesignFlag }) => !redesignFlag && 'none'};
`

export default function Staking() {
  const navigate = useNavigate()
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled
  const { account, chainId, provider } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const xxx = chainId ? XXX[chainId] : undefined

  // token warning stuff
  const [loadedInputCurrency] = [useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId)]
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency]
  )

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useToggleWalletModal()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // stake state
  const [typedValue, setTypedValue] = useState<string>()
  const handleTypeInput = useCallback(
    (value: string) => {
      setTypedValue(value)
    },
    [setTypedValue]
  )

  const stakingInfo = useStakingInfo()

  const currency = useCurrency(chainId ? XXX_ADDRESS[chainId] : undefined)

  const parsedAmount = useMemo(() => (xxx ? tryParseCurrencyAmount(typedValue, xxx) : undefined), [xxx, typedValue])

  const formattedAmounts = useMemo(() => typedValue, [typedValue])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(stakingInfo?.unStakingBalance),
    [stakingInfo]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmount?.equalTo(maxInputAmount))

  const [approvalState, approveCallback] = useApproveCallback(
    parsedAmount,
    chainId ? XXXSTAKING2_ADDRESS[chainId] : undefined
  )

  const handleApprove = useCallback(async () => {
    await approveCallback()
  }, [approveCallback])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    approvalState === ApprovalState.NOT_APPROVED ||
    approvalState === ApprovalState.PENDING ||
    (approvalSubmitted && approvalState === ApprovalState.APPROVED)

  async function onStake() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount) return

    const { calldata, value } = XXXStaking2.stakeCallParameters(parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: XXXSTAKING2_ADDRESS[chainId],
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

  async function onClaimReward() {
    if (!chainId || !provider || !account) return

    const { calldata, value } = XXXStaking2.claimRewardCallParameters()

    const txn: { to: string; data: string; value: string } = {
      to: XXXSTAKING2_ADDRESS[chainId],
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

  async function onWithdraw() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount) return

    const { calldata, value } = XXXStaking2.withdrawCallParameters(parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: XXXSTAKING2_ADDRESS[chainId],
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

  const handleMaxInput = useCallback(() => {
    maxInputAmount && setTypedValue(maxInputAmount.toExact())
    sendEvent({
      category: 'Staking',
      action: 'Max',
    })
  }, [maxInputAmount, setTypedValue])

  const approveTokenButtonDisabled = approvalState !== ApprovalState.NOT_APPROVED || approvalSubmitted

  return (
    <Trace page={PageName.SWAP_PAGE} shouldLogImpression>
      <>
        <PageWrapper redesignFlag={redesignFlagEnabled} navBarFlag={navBarFlagEnabled}>
          <SwapWrapper id="swap-page" redesignFlag={redesignFlagEnabled}>
            <AutoColumn gap={'0px'}>
              <Label>unStakingBalance:{stakingInfo?.unStakingBalance.quotient.toString()}</Label>
              <Label>earnedAmount:{stakingInfo?.earnedAmount.quotient.toString()}</Label>
              <Label>stakedAmount:{stakingInfo?.stakedAmount.quotient.toString()}</Label>
              <Label>totalStakedAmount:{stakingInfo?.totalStakedAmount.quotient.toString()}</Label>
              <div style={{ display: 'relative' }}>
                <TopInputWrapper redesignFlag={redesignFlagEnabled}>
                  <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                    <CurrencyInputPanel
                      label={<Trans>staking</Trans>}
                      value={formattedAmounts ?? ''}
                      showMaxButton={showMaxButton}
                      currency={currency ?? null}
                      onUserInput={handleTypeInput}
                      onMax={handleMaxInput}
                      fiatValue={undefined}
                      onCurrencySelect={undefined}
                      otherCurrency={undefined}
                      showCommonBases={true}
                      id={SectionName.CURRENCY_INPUT_PANEL}
                      loading={false}
                    />
                  </Trace>
                </TopInputWrapper>
              </div>
              <BottomWrapper redesignFlag={redesignFlagEnabled}>
                {redesignFlagEnabled && 'For'}
                <AutoColumn gap={redesignFlagEnabled ? '0px' : '8px'}>
                  <div>
                    {!account ? (
                      <ButtonLight onClick={toggleWalletModal} redesignFlag={redesignFlagEnabled}>
                        <Trans>Connect Wallet</Trans>
                      </ButtonLight>
                    ) : showApproveFlow ? (
                      <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                        <AutoColumn style={{ width: '100%' }} gap="12px">
                          <ButtonConfirmed
                            onClick={handleApprove}
                            disabled={approveTokenButtonDisabled}
                            width="100%"
                            altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                            confirmed={approvalState === ApprovalState.APPROVED}
                          >
                            <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                {/* we need to shorten this string on mobile */}
                                {approvalState === ApprovalState.APPROVED ? (
                                  <Trans>You can now trade {currency?.symbol}</Trans>
                                ) : (
                                  <Trans>Allow the Uniswap Protocol to use your {currency?.symbol}</Trans>
                                )}
                              </span>
                              {approvalState === ApprovalState.PENDING ? (
                                <Loader stroke="white" />
                              ) : approvalSubmitted && approvalState === ApprovalState.APPROVED ? (
                                <CheckCircle size="20" color={theme.deprecated_green1} />
                              ) : (
                                <MouseoverTooltip
                                  text={
                                    <Trans>
                                      You must give the Uniswap smart contracts permission to use your{' '}
                                      {currency?.symbol}. You only have to do this once per token.
                                    </Trans>
                                  }
                                >
                                  <HelpCircle size="20" color={'deprecated_white'} style={{ marginLeft: '8px' }} />
                                </MouseoverTooltip>
                              )}
                            </AutoRow>
                          </ButtonConfirmed>
                          <ButtonError
                            onClick={() => {
                              if (isExpertMode) {
                                //handleSwap()
                              } else {
                                onStake()
                                // setDepositState({
                                //   attemptingTxn: false,
                                //   swapErrorMessage: undefined,
                                //   showConfirm: true,
                                //   txHash: undefined,
                                // })
                              }
                            }}
                            width="100%"
                            id="swap-button"
                            disabled={approvalState !== ApprovalState.APPROVED}
                            error={true}
                          >
                            <Text fontSize={16} fontWeight={500}>
                              <Trans>Stake</Trans>
                            </Text>
                          </ButtonError>
                        </AutoColumn>
                      </AutoRow>
                    ) : (
                      <ButtonError
                        onClick={() => {
                          if (isExpertMode) {
                            //handleSwap()
                          } else {
                            onStake()
                            // setDepositState({
                            //   attemptingTxn: false,
                            //   swapErrorMessage: undefined,
                            //   showConfirm: true,
                            //   txHash: undefined,
                            // })
                          }
                        }}
                        id="swap-button"
                        disabled={false}
                        error={true}
                      >
                        <Text fontSize={20} fontWeight={500}>
                          <Trans>Stake</Trans>
                        </Text>
                      </ButtonError>
                    )}
                  </div>
                  <ButtonLight
                    onClick={() => {
                      onClaimReward()
                    }}
                    redesignFlag={redesignFlagEnabled}
                  >
                    <Trans>Claim Reward</Trans>
                  </ButtonLight>
                  <ButtonLight
                    onClick={() => {
                      onWithdraw()
                    }}
                    redesignFlag={redesignFlagEnabled}
                  >
                    <Trans>Withdraw</Trans>
                  </ButtonLight>
                </AutoColumn>
              </BottomWrapper>
            </AutoColumn>
          </SwapWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
