import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import { darken } from 'polished'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled from 'styled-components/macro'

const DEFAULT_HEIGHT = 340

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 1rem;
  padding-right: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.deprecated_bg0};
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
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
  label?: string
  symbol?: string
  value?: number
  amount?: number
  liquidityValue?: number
  liquidityAmount?: number
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({
  data,
  color = '#56B2A4',
  color2 = '#1E90FF',
  label,
  symbol,
  value,
  amount,
  liquidityValue,
  liquidityAmount,
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
  console.log(11, data)
  if (data.length === 0) {
    data.push({
      token: '',
      symbol: 'Empty',
      amount: 0,
      tokenVolume: 0,
      liquidityAmount: 0,
      liquidityVolume: 0,
    })
  }
  const CustomTooltip = (actions: any) => {
    if (actions.payload && actions.payload.length) {
      setLabel(actions.payload[0].payload.token)
      setSymbol(actions.payload[0].payload.symbol)
      setValue(actions.payload[0].value)
      setAmount(actions.payload[0].payload.amount)
      setLiquidityValue(actions.payload[0].payload.liquidityTokensVolume)
      setLiquidityAmount(actions.payload[0].payload.liquidityTokensAmount)
    } else {
      if (actions.init === undefined) {
        return null
      } else {
        setLabel(actions.init.token)
        setSymbol(actions.init.symbol)
        setValue(actions.init.tokenVolume)
        setAmount(actions.init.amount)
        setLiquidityValue(actions.init.liquidityTokensVolume)
        setLiquidityAmount(actions.init.liquidityTokensAmount)
      }
    }
    return null
  }

  return (
    <Wrapper>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 5,
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
          <Tooltip cursor={false} content={<CustomTooltip init={data?.length > 0 ? data[0] : undefined} />} />
          <Legend />
          <Bar dataKey="tokenVolume" stackId="a" stroke={color} fill="url(#gradient)" maxBarSize={80} />
          <Bar dataKey="liquidityTokensVolume" stackId="a" stroke={color2} fill="url(#gradient2)" maxBarSize={80} />
        </BarChart>
      </ResponsiveContainer>
    </Wrapper>
  )
}

export default Chart
