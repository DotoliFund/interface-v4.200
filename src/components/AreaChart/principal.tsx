import Card from 'components/Card'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { darken } from 'polished'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { useState } from 'react'
import { Area, AreaChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled from 'styled-components/macro'
import { unixToDate } from 'utils/date'
import { formatTime } from 'utils/date'

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

export type AreaChartProps = {
  data: any[]
  color?: string | undefined
  color2?: string | undefined
  height?: number | undefined
  minHeight?: number
  setLabel: Dispatch<SetStateAction<string | undefined>>
  setValue: Dispatch<SetStateAction<number | undefined>>
  setPrincipal: Dispatch<SetStateAction<number | undefined>>
  setTokens: Dispatch<SetStateAction<string[] | undefined>>
  setSymbols: Dispatch<SetStateAction<string[] | undefined>>
  setTokensVolumeUSD: Dispatch<SetStateAction<number[] | undefined>>
  label?: string
  value?: number
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
  value,
  setLabel,
  setValue,
  setPrincipal,
  setTokens,
  setSymbols,
  setTokensVolumeUSD,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  minHeight = DEFAULT_HEIGHT,
  ...rest
}: AreaChartProps) => {
  const [presentCursor, setPresentCursor] = useState<boolean | true>()

  const CustomTooltip = (props: any) => {
    if (props.active) {
      setPresentCursor(false)
    } else {
      setPresentCursor(true)
    }

    if (props.payload && props.payload.length) {
      setLabel(props.payload[0].payload.time)
      setValue(props.payload[0].value)
      setPrincipal(props.payload[0].payload.principal)
      setTokens(props.payload[0].payload.tokens)
      setSymbols(props.payload[0].payload.symbols)
      setTokensVolumeUSD(props.payload[0].payload.tokensVolume)
    }
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
    <Wrapper minHeight={minHeight} {...rest}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      {data?.length === 0 ? (
        <Loader>
          <div />
          <div />
          <div />
        </Loader>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
            onMouseLeave={() => {
              setLabel && setLabel(undefined)
              setValue && setValue(undefined)
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
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickFormatter={(time) => dayjs(unixToDate(time)).format('DD')}
              minTickGap={10}
            />
            <Tooltip content={<CustomTooltip />} />
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
            <Area dataKey="volume" type="monotone" stroke={color} fill="url(#gradient)" strokeWidth={2} />
            <Area dataKey="principal" type="monotone" stroke={color2} fill="url(#gradient)" strokeWidth={2} />
          </AreaChart>
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
