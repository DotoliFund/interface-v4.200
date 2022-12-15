import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import { darken } from 'polished'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
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
  label?: string
  symbol?: string
  value?: number
  amount?: number
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({
  data,
  color = '#56B2A4',
  color2 = '#4A2B65',
  label,
  symbol,
  value,
  amount,
  setLabel,
  setSymbol,
  setValue,
  setAmount,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  minHeight = DEFAULT_HEIGHT,
  ...rest
}: BarChartProps) => {
  if (data.length === 0) {
    data.push({
      token: '',
      symbol: 'Empty',
      amount: 0,
      tokenVolume: 0,
    })
  }
  const CustomTooltip = (props: any) => {
    if (props.payload && props.payload.length) {
      setLabel(props.payload[0].payload.token)
      setSymbol(props.payload[0].payload.symbol)
      setValue(props.payload[0].value)
      setAmount(props.payload[0].payload.amount)
    } else {
      if (props.init === undefined) {
        return null
      } else {
        setLabel(props.init.token)
        setSymbol(props.init.symbol)
        setValue(props.init.tokenVolume)
        setAmount(props.init.amount)
      }
    }
    return null
  }

  return (
    <Wrapper minHeight={minHeight} {...rest}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      {
        <ResponsiveContainer width="100%" height="100%">
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
            <XAxis dataKey="symbol" axisLine={false} tickLine={false} minTickGap={10} />
            <Tooltip cursor={false} content={<CustomTooltip init={data?.length > 0 ? data[0] : undefined} />} />
            <Bar dataKey="tokenVolume" type="monotone" stroke={color} fill="url(#gradient)" maxBarSize={80} />
          </BarChart>
        </ResponsiveContainer>
      }
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default Chart
