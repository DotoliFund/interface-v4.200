import Card from 'components/Card'
import { LoadingRows } from 'components/Loader'
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
  setLabel: Dispatch<SetStateAction<string | undefined>> // used for label of value
  setSymbol: Dispatch<SetStateAction<string | undefined>> // used for label of value
  setValue: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  setAmount: Dispatch<SetStateAction<number | undefined>> // used for value on hover
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
  const CustomTooltip = (actions: any) => {
    if (actions.payload && actions.payload.length) {
      setLabel(actions.payload[0].payload.token)
      setSymbol(actions.payload[0].payload.symbol)
      setValue(actions.payload[0].value)
      setAmount(actions.payload[0].payload.amount)
    } else {
      setLabel(actions.init.token)
      setSymbol(actions.init.symbol)
      setValue(actions.init.tokenVolume)
      setAmount(actions.init.amount)
    }
    return null
  }

  return (
    <Wrapper minHeight={minHeight} {...rest}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      {data?.length === 0 ? (
        <LoadingRows>
          <div />
          <div />
          <div />
        </LoadingRows>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            width={500}
            height={340}
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
            <XAxis dataKey="symbol" axisLine={false} tickLine={false} minTickGap={10} />
            <Tooltip cursor={false} content={<CustomTooltip init={data?.length > 0 ? data[0] : undefined} />} />
            <Bar dataKey="tokenVolume" type="monotone" stroke={color} fill="url(#gradient)" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default Chart
