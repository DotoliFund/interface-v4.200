import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonConfirmed, ButtonError, ButtonGray, ButtonLight } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel/StakingCurrencyInputPanel'
import Loader from 'components/Loader'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { PageWrapper, SwapWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { MouseoverTooltip } from 'components/Tooltip'
import { XXX_ADDRESS, XXXSTAKING2_ADDRESS } from 'constants/addresses'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { XXXStaking2 } from 'interface/XXXStaking2'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle, HelpCircle } from 'react-feather'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useStakingInfo } from 'state/stake/hooks'
import { useExpertModeManager } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { XXX } from '../../constants/tokens'

const StyledStakingHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text2};
`

const StakingSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
  padding: 16px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.backgroundModule};
  }
  &:hover:before {
    border-color: ${({ theme }) => theme.stateOverlayHover};
  }
  &:focus-within:before {
    border-color: ${({ theme }) => theme.stateOverlayPressed};
  }
`

const OptionButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 4px 6px;
  width: 90%;
  background-color: ${({ theme }) => theme.deprecated_bg0};
`

export default function Staking() {
  const { account, chainId, provider } = useWeb3React()
  const xxx = chainId ? XXX[chainId] : undefined

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

  async function onGetReward() {
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
    if (!currency || !stakingInfo) return

    const { calldata, value } = XXXStaking2.withdrawCallParameters(stakingInfo.stakedAmount)
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
        <PageWrapper>
          <SwapWrapper id="swap-page">
            <StyledStakingHeader>
              <RowBetween>
                <RowFixed>
                  <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                    <Trans>Staking</Trans>
                  </ThemedText.DeprecatedBlack>
                </RowFixed>
              </RowBetween>
            </StyledStakingHeader>
            <AutoColumn gap={'12px'}>
              <Card backgroundColor={'#202B58'}>
                <RowBetween>
                  <AutoColumn gap="10px">
                    <Text ml={'20px'}>UnStaked</Text>
                    <Text ml={'20px'}>Earned</Text>
                    <Text ml={'20px'}>Staked</Text>
                    <Text ml={'20px'}>Total Staked</Text>
                  </AutoColumn>
                  <AutoColumn gap="10px">
                    <Text ml={'32px'}>{formatCurrencyAmount(stakingInfo?.unStakingBalance, 12)}</Text>
                    <Text ml={'32px'}>{formatCurrencyAmount(stakingInfo?.earnedAmount, 12)}</Text>
                    <Text ml={'32px'}>{formatCurrencyAmount(stakingInfo?.stakedAmount, 12)}</Text>
                    <Text ml={'32px'}>{formatCurrencyAmount(stakingInfo?.totalStakedAmount, 12)}</Text>
                  </AutoColumn>
                  <AutoColumn gap="8px">
                    <OptionButton
                      mr={'20px'}
                      onClick={() => {
                        onGetReward()
                      }}
                    >
                      Get Reward
                    </OptionButton>
                    <OptionButton
                      mr={'20px'}
                      onClick={() => {
                        onWithdraw()
                      }}
                    >
                      Withdraw
                    </OptionButton>
                  </AutoColumn>
                </RowBetween>
              </Card>
              <div style={{ display: 'relative' }}>
                <StakingSection>
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
                </StakingSection>
              </div>
              <AutoColumn gap={'8px'}>
                <div>
                  {!account ? (
                    <ButtonLight onClick={toggleWalletModal}>
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
                                    You must give the Uniswap smart contracts permission to use your {currency?.symbol}.
                                    You only have to do this once per token.
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
              </AutoColumn>
            </AutoColumn>
          </SwapWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
