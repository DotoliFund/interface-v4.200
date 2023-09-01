import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName, SectionName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { sendEvent } from 'components/analytics'
import { ButtonError, ButtonLight, ButtonYellow } from 'components/Button'
import { AutoColumn } from 'components/Column'
import RewardCurrencyInputPanel from 'components/CurrencyInputPanel/RewardInputPanel'
import StakingCurrencyInputPanel from 'components/CurrencyInputPanel/StakingInputPanel'
import UnstakingCurrencyInputPanel from 'components/CurrencyInputPanel/UnstakingInputPanel'
import { RowBetween, RowFixed, RowFlat } from 'components/Row'
import { PageWrapper, SwapWrapper as StakingWrapper } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { DOTOLI_ADDRESS, DOTOLI_STAKING_ADDRESS } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { DotoliStaking } from 'interface/DotoliStaking'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ErrorContainer, NetworkIcon } from 'pages/Account'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useStakingInfo } from 'state/stake/hooks'
import { useExpertModeManager } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import Loader from '../../components/Loader'
import { DTL } from '../../constants/tokens'

const StyledStakingHeader = styled.div`
  padding: 4px 14px;
  width: 100%;
  color: ${({ theme }) => theme.deprecated_text4};
`

const StakingSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 16px;
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

const ToggleRow = styled(RowFlat)`
  justify-content: flex-end;
  margin-bottom: 10px;

  @media screen and (max-width: 600px) {
    flex-direction: row;
  }
`

const StakingInfoWrapper = styled.button<{ width?: string }>`
  display: flex;
  align-items: center;
  width: ${({ width }) => width ?? '100%'};
  padding: 1px;
  background: ${({ theme }) => theme.deprecated_bg1};
  border-radius: 8px;
  border: ${({ theme }) => '1px solid ' + theme.backgroundInteractive};
  outline: none;
`

const StakingInfoElement = styled.span<{ isActive?: boolean; fontSize?: string }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0.5rem;
  border-radius: 6px;
  justify-content: center;
  height: 100%;
  background: ${({ theme, isActive }) => (isActive ? theme.backgroundSurface : 'none')};
  color: ${({ theme, isActive }) => (isActive ? theme.textPrimary : theme.textTertiary)};
  font-size: ${({ fontSize }) => fontSize ?? '1rem'};
  font-weight: 500;
  white-space: nowrap;
  :hover {
    user-select: initial;
    color: ${({ theme, isActive }) => (isActive ? theme.textSecondary : theme.textTertiary)};
  }
`

enum StakeView {
  STAKE,
  UNSTAKE,
  REWARD,
}

export default function Staking() {
  const { account, chainId, provider } = useWeb3React()
  const dtl = chainId ? DTL[chainId] : undefined

  const theme = useTheme()

  const [view, setView] = useState(StakeView.STAKE)

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
  const currency = useCurrency(chainId ? DOTOLI_ADDRESS[chainId] : undefined)
  const parsedAmount = useMemo(() => (dtl ? tryParseCurrencyAmount(typedValue, dtl) : undefined), [dtl, typedValue])
  const formattedAmounts = useMemo(() => typedValue, [typedValue])

  const maxStakingInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(stakingInfo?.unStakingBalance),
    [stakingInfo]
  )
  const showMaxStakingButton = Boolean(
    maxStakingInputAmount?.greaterThan(0) && !parsedAmount?.equalTo(maxStakingInputAmount)
  )

  const maxUnstakingInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(stakingInfo?.stakedAmount),
    [stakingInfo]
  )
  const showMaxUnstakingButton = Boolean(
    maxUnstakingInputAmount?.greaterThan(0) && !parsedAmount?.equalTo(maxUnstakingInputAmount)
  )

  const maxRewardInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(stakingInfo?.rewardAmount),
    [stakingInfo]
  )
  const showMaxRewardButton = Boolean(
    maxRewardInputAmount?.greaterThan(0) && !parsedAmount?.equalTo(maxRewardInputAmount)
  )

  const [approvalState, approveCallback] = useApproveCallback(
    parsedAmount,
    chainId ? DOTOLI_STAKING_ADDRESS[chainId] : undefined
  )

  const handleApprove = useCallback(async () => {
    try {
      await approveCallback()
    } catch (e) {
      console.error(e)
    }
  }, [approveCallback])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  // // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // // never show if price impact is above threshold in non expert mode
  // const showApproveFlow =
  //   approvalState === ApprovalState.NOT_APPROVED ||
  //   approvalState === ApprovalState.PENDING ||
  //   (approvalSubmitted && approvalState === ApprovalState.APPROVED)

  async function onStake() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount) return

    const { calldata, value } = DotoliStaking.stakeCallParameters(parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_STAKING_ADDRESS[chainId],
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
    if (!currency || !parsedAmount) return

    const { calldata, value } = DotoliStaking.claimRewardCallParameters(parsedAmount)

    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_STAKING_ADDRESS[chainId],
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

  async function onUnstake() {
    if (!chainId || !provider || !account) return
    if (!currency || !parsedAmount) return

    const { calldata, value } = DotoliStaking.unstakingCallParameters(parsedAmount)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_STAKING_ADDRESS[chainId],
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

  const handleMaxStakeInput = useCallback(() => {
    maxStakingInputAmount && setTypedValue(maxStakingInputAmount.toExact())
    sendEvent({
      category: 'Staking',
      action: 'Max',
    })
  }, [maxStakingInputAmount, setTypedValue])

  const handleMaxUnstakingInput = useCallback(() => {
    maxUnstakingInputAmount && setTypedValue(maxUnstakingInputAmount.toExact())
    sendEvent({
      category: 'UnStaking',
      action: 'Max',
    })
  }, [maxUnstakingInputAmount, setTypedValue])

  const handleMaxRewardInput = useCallback(() => {
    maxRewardInputAmount && setTypedValue(maxRewardInputAmount.toExact())
    sendEvent({
      category: 'Staking Reward',
      action: 'Max',
    })
  }, [maxRewardInputAmount, setTypedValue])

  return (
    <Trace page={PageName.STAKING_PAGE} shouldLogImpression>
      {isSupportedChain(chainId) ? (
        <>
          <PageWrapper>
            <StakingWrapper id="staking-page">
              <StyledStakingHeader>
                <RowBetween>
                  <RowFixed>
                    <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
                      <Trans>Staking</Trans>
                    </ThemedText.DeprecatedBlack>
                  </RowFixed>
                  <ToggleRow style={{ marginRight: '30px' }}>
                    <ToggleWrapper width="240px">
                      <ToggleElement
                        isActive={view === StakeView.STAKE}
                        fontSize="12px"
                        onClick={() => (view === StakeView.STAKE ? {} : setView(StakeView.STAKE))}
                      >
                        <Trans>Stake</Trans>
                      </ToggleElement>
                      <ToggleElement
                        isActive={view === StakeView.UNSTAKE}
                        fontSize="12px"
                        onClick={() => (view === StakeView.UNSTAKE ? {} : setView(StakeView.UNSTAKE))}
                      >
                        <Trans>Unstake</Trans>
                      </ToggleElement>

                      <ToggleElement
                        isActive={view === StakeView.REWARD}
                        fontSize="12px"
                        onClick={() => (view === StakeView.REWARD ? {} : setView(StakeView.REWARD))}
                      >
                        <Trans>Reward</Trans>
                      </ToggleElement>
                    </ToggleWrapper>
                  </ToggleRow>
                </RowBetween>
              </StyledStakingHeader>
              <AutoColumn gap="12px">
                <StakingInfoWrapper>
                  <StakingInfoElement>
                    <RowBetween>
                      <AutoColumn gap="10px" justify="start">
                        <Text ml="20px">
                          <Trans>Holding</Trans>
                        </Text>
                        <Text ml="20px">
                          <Trans>Staked</Trans>
                        </Text>
                        <Text ml="20px">
                          <Trans>Reward</Trans>
                        </Text>
                        <Text ml="20px">
                          <Trans>Remaining Reward</Trans>
                        </Text>
                      </AutoColumn>
                      <AutoColumn gap="10px" justify="end">
                        <Text mr="20px">{formatCurrencyAmount(stakingInfo?.unStakingBalance, 12)}</Text>
                        <Text mr="20px">{formatCurrencyAmount(stakingInfo?.stakedAmount, 12)}</Text>
                        <Text mr="20px">{formatCurrencyAmount(stakingInfo?.rewardAmount, 12)}</Text>
                        <Text mr="20px">{formatCurrencyAmount(stakingInfo?.remainingReward, 12)}</Text>
                      </AutoColumn>
                    </RowBetween>
                  </StakingInfoElement>
                </StakingInfoWrapper>
                {view === StakeView.STAKE ? (
                  <>
                    <div style={{ display: 'relative' }}>
                      <StakingSection>
                        <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                          <StakingCurrencyInputPanel
                            label={<Trans>staking</Trans>}
                            value={formattedAmounts ?? ''}
                            showMaxButton={showMaxStakingButton}
                            currency={currency ?? null}
                            onUserInput={handleTypeInput}
                            onMax={handleMaxStakeInput}
                            fiatValue={undefined}
                            onCurrencySelect={undefined}
                            otherCurrency={undefined}
                            id={SectionName.CURRENCY_INPUT_PANEL}
                            loading={false}
                          />
                        </Trace>
                      </StakingSection>
                    </div>
                    <AutoColumn gap="8px">
                      <div>
                        {!account ? (
                          <ButtonLight onClick={toggleWalletModal}>
                            <Trans>Connect Wallet</Trans>
                          </ButtonLight>
                        ) : !stakingInfo?.remainingReward.greaterThan(JSBI.BigInt(0)) ? (
                          <ButtonError
                            onClick={() => {
                              if (isExpertMode) {
                                //onStake()
                              } else {
                                onStake()
                              }
                            }}
                            width="100%"
                            id="staking-button"
                            disabled={true}
                            error={true}
                          >
                            <Text fontSize={20} fontWeight={500}>
                              <Trans>Closed</Trans>
                            </Text>
                          </ButtonError>
                        ) : approvalState === ApprovalState.NOT_APPROVED ? (
                          <ButtonYellow onClick={handleApprove} disabled={false} width="100%" style={{ gap: 14 }}>
                            <div style={{ height: 20 }}>
                              <MouseoverTooltip
                                text={
                                  <Trans>
                                    Permission is required for Uniswap to swap each token. This will expire after one
                                    month for your security.
                                  </Trans>
                                }
                              >
                                <Info size={20} />
                              </MouseoverTooltip>
                            </div>
                            <Trans>Approve use of DTL</Trans>
                          </ButtonYellow>
                        ) : approvalState === ApprovalState.PENDING ? (
                          <ButtonYellow
                            onClick={() => {
                              return
                            }}
                            id="deposit-button"
                            disabled={true}
                            style={{ gap: 14 }}
                          >
                            <>
                              <Loader size="20px" />
                              <Trans>Approval pending</Trans>{' '}
                            </>
                          </ButtonYellow>
                        ) : (
                          <ButtonYellow
                            onClick={() => {
                              if (isExpertMode) {
                                //onStake()
                              } else {
                                onStake()
                              }
                            }}
                            id="staking-button"
                            disabled={false}
                          >
                            <Text fontSize={20} fontWeight={500}>
                              <Trans>Stake</Trans>
                            </Text>
                          </ButtonYellow>
                        )}
                      </div>
                    </AutoColumn>
                  </>
                ) : view === StakeView.UNSTAKE ? (
                  <>
                    <div style={{ display: 'relative' }}>
                      <StakingSection>
                        <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                          <UnstakingCurrencyInputPanel
                            label={<Trans>unstaking</Trans>}
                            value={formattedAmounts ?? ''}
                            showMaxButton={showMaxUnstakingButton}
                            currency={currency ?? null}
                            unstakingCurrencyBalance={stakingInfo?.stakedAmount}
                            onUserInput={handleTypeInput}
                            onMax={handleMaxUnstakingInput}
                            fiatValue={undefined}
                            onCurrencySelect={undefined}
                            otherCurrency={undefined}
                            id={SectionName.CURRENCY_INPUT_PANEL}
                            loading={false}
                          />
                        </Trace>
                      </StakingSection>
                    </div>
                    <AutoColumn gap="8px">
                      <div>
                        {!account ? (
                          <ButtonLight onClick={toggleWalletModal}>
                            <Trans>Connect Wallet</Trans>
                          </ButtonLight>
                        ) : (
                          <ButtonYellow
                            onClick={() => {
                              if (isExpertMode) {
                                //onUnstake()
                              } else {
                                onUnstake()
                              }
                            }}
                            id="unstake-button"
                            disabled={false}
                          >
                            <Text fontSize={20} fontWeight={500}>
                              <Trans>Unstake</Trans>
                            </Text>
                          </ButtonYellow>
                        )}
                      </div>
                    </AutoColumn>
                  </>
                ) : view === StakeView.REWARD ? (
                  <>
                    <div style={{ display: 'relative' }}>
                      <StakingSection>
                        <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                          <RewardCurrencyInputPanel
                            label={<Trans>reward</Trans>}
                            value={formattedAmounts ?? ''}
                            showMaxButton={showMaxRewardButton}
                            currency={currency ?? null}
                            rewardCurrencyBalance={stakingInfo?.rewardAmount}
                            onUserInput={handleTypeInput}
                            onMax={handleMaxRewardInput}
                            fiatValue={undefined}
                            onCurrencySelect={undefined}
                            otherCurrency={undefined}
                            id={SectionName.CURRENCY_INPUT_PANEL}
                            loading={false}
                          />
                        </Trace>
                      </StakingSection>
                    </div>
                    <AutoColumn gap="8px">
                      <div>
                        {!account ? (
                          <ButtonLight onClick={toggleWalletModal}>
                            <Trans>Connect Wallet</Trans>
                          </ButtonLight>
                        ) : (
                          <ButtonYellow
                            onClick={() => {
                              if (isExpertMode) {
                                //onGetReward()
                              } else {
                                onGetReward()
                              }
                            }}
                            id="reward-button"
                            disabled={false}
                          >
                            <Text fontSize={20} fontWeight={500}>
                              <Trans>Get Reward</Trans>
                            </Text>
                          </ButtonYellow>
                        )}
                      </div>
                    </AutoColumn>
                  </>
                ) : (
                  <></>
                )}
              </AutoColumn>
            </StakingWrapper>
          </PageWrapper>
          <SwitchLocaleLink />
        </>
      ) : chainId !== undefined ? (
        <ErrorContainer>
          <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
            <NetworkIcon strokeWidth={1.2} />
            <div data-testid="pools-unsupported-err">
              <Trans>Your connected network is unsupported.</Trans>
            </div>
          </ThemedText.DeprecatedBody>
        </ErrorContainer>
      ) : null}
    </Trace>
  )
}
