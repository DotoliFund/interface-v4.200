import { formatEther } from '@ethersproject/units'

export const formatEthPrice = (price: string | undefined) => {
  if (!price) return 0

  const formattedPrice = parseFloat(formatEther(String(price)))
  return (
    Math.round(formattedPrice * (formattedPrice >= 1 ? 100 : 1000) + Number.EPSILON) /
    (formattedPrice >= 1 ? 100 : 1000)
  )
}

export const ethNumberStandardFormatter = (amount: string | number | undefined, includeDollarSign = false): string => {
  if (!amount) return '-'

  const amountInDecimals = parseFloat(amount.toString())
  const conditionalDollarSign = includeDollarSign ? '$' : ''

  if (amountInDecimals < 0.0001) return `< ${conditionalDollarSign}0.00001`
  if (amountInDecimals < 1) return `${conditionalDollarSign}${amountInDecimals.toFixed(3)}`
  return (
    conditionalDollarSign +
    amountInDecimals
      .toFixed(2)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  )
}

export const formatWeiToDecimal = (amount: string) => {
  if (!amount) return '-'
  return ethNumberStandardFormatter(formatEther(amount))
}
