import { Currency, Token } from '@uniswap/sdk-core'
import TokenSafety from 'components/TokenSafety'
import { memo, useCallback, useEffect, useState } from 'react'
import { useUserAddedTokens } from 'state/user/hooks'

import useLast from '../../hooks/useLast'
import { useWindowSize } from '../../hooks/useWindowSize'
import Modal from '../Modal'
import { InvestorCurrencySearch } from './InvestorCurrencySearch'
import { WhiteListCurrencySearch } from './WhiteListCurrencySearch'

interface CurrencySearchModalProps {
  isOpen: boolean
  isFund: boolean
  showWrappedETH: boolean
  fundAddress: string | null
  investorAddress: string | null
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
}

export enum CurrencyModalView {
  search,
  importToken,
  tokenSafety,
}

export default memo(function CurrencySearchModal({
  isOpen,
  isFund,
  showWrappedETH,
  fundAddress,
  investorAddress,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false,
  showCurrencyAmount = true,
  disableNonToken = false,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.search)
  const lastOpen = useLast(isOpen)
  const userAddedTokens = useUserAddedTokens()

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  const showTokenSafetySpeedbump = (token: Token) => {
    setWarningToken(token)
    setModalView(CurrencyModalView.tokenSafety)
  }

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      if (hasWarning && currency.isToken && !userAddedTokens.find((token) => token.equals(currency))) {
        showTokenSafetySpeedbump(currency)
      } else {
        onCurrencySelect(currency)
        onDismiss()
      }
    },
    [onDismiss, onCurrencySelect, userAddedTokens]
  )
  // used for token safety
  const [warningToken, setWarningToken] = useState<Token | undefined>()

  const { height: windowHeight } = useWindowSize()
  // change min height if not searching
  let modalHeight: number | undefined = 80
  let content = null
  switch (modalView) {
    case CurrencyModalView.search:
      if (windowHeight) {
        // Converts pixel units to vh for Modal component
        modalHeight = Math.min(Math.round((680 / windowHeight) * 100), 80)
      }
      if (isFund && fundAddress && investorAddress) {
        content = (
          <InvestorCurrencySearch
            isOpen={isOpen}
            onDismiss={onDismiss}
            onCurrencySelect={handleCurrencySelect}
            selectedCurrency={selectedCurrency}
            otherSelectedCurrency={otherSelectedCurrency}
            showCurrencyAmount={showCurrencyAmount}
            disableNonToken={disableNonToken}
          />
        )
      } else {
        content = (
          <WhiteListCurrencySearch
            isOpen={isOpen}
            showWrappedETH={showWrappedETH}
            onDismiss={onDismiss}
            onCurrencySelect={handleCurrencySelect}
            selectedCurrency={selectedCurrency}
            otherSelectedCurrency={otherSelectedCurrency}
            showCommonBases={showCommonBases}
            showCurrencyAmount={showCurrencyAmount}
            disableNonToken={disableNonToken}
          />
        )
      }

      break
    case CurrencyModalView.tokenSafety:
      modalHeight = undefined
      if (warningToken) {
        content = (
          <TokenSafety
            tokenAddress={warningToken.address}
            onContinue={() => handleCurrencySelect(warningToken)}
            onCancel={() => setModalView(CurrencyModalView.search)}
            showCancel={true}
          />
        )
      }
      break
  }
  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={isFund && modalHeight ? modalHeight * 0.6 : modalHeight}
      minHeight={isFund && modalHeight ? modalHeight * 0.6 : modalHeight}
    >
      {content}
    </Modal>
  )
})
