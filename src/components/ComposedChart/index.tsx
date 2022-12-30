import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { darken } from 'polished'
import { useEffect, useState } from 'react'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { Bar, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled, { css } from 'styled-components/macro'
import { formatTime, unixToDate } from 'utils/date'

dayjs.extend(utc)

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

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

export type ComposedChartProps = {
  data: any[]
  color?: string | undefined
  color2?: string | undefined
  color3?: string | undefined
  minHeight?: number
  setLabel: Dispatch<SetStateAction<string | undefined>>
  setValue: Dispatch<SetStateAction<number | undefined>>
  setLiquidityVolume: Dispatch<SetStateAction<number | undefined>>
  setPrincipal: Dispatch<SetStateAction<number | undefined>>
  setTokens: Dispatch<SetStateAction<string[] | undefined>>
  setSymbols: Dispatch<SetStateAction<string[] | undefined>>
  setTokensVolumeUSD: Dispatch<SetStateAction<number[] | undefined>>
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
  color3 = '#99FF99',
  setLabel,
  setValue,
  setLiquidityVolume,
  setPrincipal,
  setTokens,
  setSymbols,
  setTokensVolumeUSD,
  topLeft,
  topRight,
}: ComposedChartProps) => {
  const [presentCursor, setPresentCursor] = useState<boolean | true>()

  const CustomTooltip = (props: any) => {
    const active = props.active ? false : true
    const payload = props.payload && props.payload.length > 0 ? props.payload[0] : undefined
    const time = payload ? payload.payload.time : undefined
    const value = payload ? payload.value : undefined
    const liquidityVolume = payload ? payload.payload.Liquidity : undefined
    const principal = payload ? payload.payload.Principal : undefined
    const tokens = payload ? payload.payload.tokens : undefined
    const symbols = payload ? payload.payload.symbols : undefined
    const tokensVolume = payload ? payload.payload.tokensVolume : undefined

    useEffect(() => {
      setPresentCursor(active)
      setLabel(time)
      setValue(value)
      setLiquidityVolume(liquidityVolume)
      setPrincipal(principal)
      setTokens(tokens)
      setSymbols(symbols)
      setTokensVolumeUSD(tokensVolume)
    }, [active, time, value, liquidityVolume, principal, tokens, symbols, tokensVolume])

    return null
  }

  const CustomizedLabel = (props: any) => {
    return (
      <text x={props.viewBox.x - 10} y={props.viewBox.height / 12} fill="yellow" fontSize={14} textAnchor="end">
        {formatTime(props.date.toString(), 8)}
      </text>
    )
  }

  return (
    <Wrapper>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      {data?.length === 0 ? (
        <LoadingRows>
          <div style={{ height: '250px' }} />
        </LoadingRows>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
            onMouseLeave={() => {
              setLabel && setLabel(undefined)
              setValue && setValue(undefined)
              setLiquidityVolume && setLiquidityVolume(undefined)
              setPrincipal && setPrincipal(undefined)
              setTokens && setTokens(undefined)
              setSymbols && setSymbols(undefined)
              setTokensVolumeUSD && setTokensVolumeUSD(undefined)
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
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickFormatter={(time) => dayjs(unixToDate(time)).format('DD')}
              minTickGap={10}
            />
            <Tooltip cursor={false} content={<CustomTooltip init={data?.length > 0 ? data[0] : undefined} />} />
            <Legend />
            {presentCursor ? (
              <ReferenceLine
                x={data[data.length - 1].time}
                stroke="yellow"
                strokeWidth={1}
                label={<CustomizedLabel date={data[data.length - 1].time} />}
                strokeDasharray="3 3"
              />
            ) : null}
            <Bar dataKey="Volume" stackId="a" stroke={color} fill={color} maxBarSize={80} />
            <Bar dataKey="Liquidity" stackId="a" stroke={color2} fill={color2} maxBarSize={80} />
            <Line dataKey="Principal" type="monotone" stroke={color3} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Wrapper>
  )
}

export default Chart
