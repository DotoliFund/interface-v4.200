import { Trans } from '@lingui/macro'
import Card from 'components/Card'
import { RowBetween } from 'components/Row'
import React, { Dispatch, ReactNode, SetStateAction, useEffect } from 'react'
import { BarChart as BarChartIcon } from 'react-feather'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const DEFAULT_HEIGHT = 340

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 1rem;
  padding-right: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.backgroundSurface};
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

type BarChartProps = {
  data: any[]
  color?: string | undefined
  color2?: string | undefined
  minHeight?: number
  setIndex: Dispatch<SetStateAction<number | undefined>>
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({ data, color = '#56B2A4', setIndex, topLeft, topRight, bottomLeft, bottomRight }: BarChartProps) => {
  const theme = useTheme()
  const isEmptyData = !data || data.length === 0

  const CustomTooltip = (props: any) => {
    const payload = props.payload && props.payload.length > 0 ? props.payload[0] : undefined
    const index = payload ? payload.payload.index : undefined

    useEffect(() => {
      setIndex(index)
    }, [index])

    return null
  }

  return (
    <Wrapper backgroundColor={!isEmptyData ? theme.deprecated_bg1 : undefined}>
      <RowBetween padding="5sp">
        {isEmptyData ? null : (
          <>
            {topLeft ?? null}
            {topRight ?? null}
          </>
        )}
      </RowBetween>
      <ResponsiveContainer width="100%" height="100%">
        {isEmptyData ? (
          <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center" paddingTop="80px">
            <BarChartIconComponent strokeWidth={1} />
            <div>
              <Trans>No fee tokens</Trans>
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
            <XAxis dataKey="symbol" axisLine={false} tickLine={false} minTickGap={10} />
            <Tooltip cursor={false} content={<CustomTooltip init={data?.length > 0 ? data[0] : undefined} />} />
            <Bar dataKey="amount" type="monotone" stroke={color} fill={color} maxBarSize={80} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default Chart
