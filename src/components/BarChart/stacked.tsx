import { Trans } from '@lingui/macro'
import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import { darken } from 'polished'
import React, { Dispatch, ReactNode, SetStateAction, useEffect } from 'react'
import { BarChart as BarChartIcon } from 'react-feather'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const DEFAULT_HEIGHT = 340

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 1rem;
  padding-right: 1rem;
  display: flex;
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const BarChartIconComponent = styled(BarChartIcon)`
  ${IconStyle}
`

export type BarChartProps = {
  data: any[]
  color?: string | undefined
  color2?: string | undefined
  minHeight?: number
  setLabel: Dispatch<SetStateAction<string | undefined>>
  setSymbol: Dispatch<SetStateAction<string | undefined>>
  setValue: Dispatch<SetStateAction<number | undefined>>
  setAmount: Dispatch<SetStateAction<number | undefined>>
  setLiquidityValue: Dispatch<SetStateAction<number | undefined>>
  setLiquidityAmount: Dispatch<SetStateAction<number | undefined>>
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({
  data,
  color = '#56B2A4',
  color2 = '#1E90FF',
  setLabel,
  setSymbol,
  setValue,
  setAmount,
  setLiquidityValue,
  setLiquidityAmount,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  ...rest
}: BarChartProps) => {
  const theme = useTheme()
  const isEmptyData = !data || data.length === 0

  const CustomTooltip = (props: any) => {
    const payload = props.payload && props.payload.length > 0 ? props.payload[0] : undefined
    const token = payload ? payload.payload.token : undefined
    const symbol = payload ? payload.payload.symbol : undefined
    const value = payload ? payload.value : undefined
    const amount = payload ? payload.payload.amount : undefined
    const liquidity = payload ? payload.payload.Liquidity : undefined
    const liquidityAmount = payload ? payload.payload.liquidityAmount : undefined

    useEffect(() => {
      setLabel(token)
      setSymbol(symbol)
      setValue(value)
      setAmount(amount)
      setLiquidityValue(liquidity)
      setLiquidityAmount(liquidityAmount)
    }, [token, symbol, value, amount, liquidity, liquidityAmount])

    return null
  }

  return (
    <Wrapper backgroundColor={!isEmptyData ? theme.deprecated_bg0 : undefined}>
      <RowBetween>
        {isEmptyData ? null : (
          <>
            {topLeft ?? null}
            {topRight ?? null}
          </>
        )}
      </RowBetween>
      <ResponsiveContainer width="100%" height="100%">
        {isEmptyData ? (
          <ThemedText.DeprecatedBody color={theme.deprecated_text3} textAlign="center" paddingTop={'80px'}>
            <BarChartIconComponent strokeWidth={1} />
            <div>
              <Trans>No token data</Trans>
            </div>
          </ThemedText.DeprecatedBody>
        ) : (
          <BarChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darken(0.36, color)} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <defs>
              <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darken(0.36, color2)} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color2} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="symbol" axisLine={false} tickLine={false} />
            <Tooltip cursor={false} content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Volume" stackId="a" stroke={color} fill={color} maxBarSize={80} />
            <Bar dataKey="Liquidity" stackId="a" stroke={color2} fill={color2} maxBarSize={80} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Wrapper>
  )
}

export default Chart
