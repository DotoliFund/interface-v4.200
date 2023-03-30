import { Trans } from '@lingui/macro'
import Card from 'components/Card'
import React, { ReactNode } from 'react'
import { PieChart as PieChartIcon } from 'react-feather'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
const RADIAN = Math.PI / 180
const DEFAULT_HEIGHT = 340

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const PieChartIconComponent = styled(PieChartIcon)`
  ${IconStyle}
`

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;

  padding-right: 1rem;
  display: flex;
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

export type PieChartProps = {
  data: any[]
  topLeft?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({ data, topLeft }: PieChartProps) => {
  const theme = useTheme()

  const isEmptyData = !data || data.length === 0

  const RenderCustomizedLabel = (active: any) => {
    const radius = active.innerRadius + (active.outerRadius - active.innerRadius) * 0.5
    const x = active.cx + radius * Math.cos(-active.midAngle * RADIAN)
    const y = active.cy + radius * Math.sin(-active.midAngle * RADIAN)

    return (
      <g>
        <text x={x + 5} y={y - 10} fill="white" textAnchor={x > active.cx ? 'start' : 'end'} dominantBaseline="central">
          {`${active.payload.symbol === 'WETH' ? 'ETH' : active.payload.symbol}`}
        </text>
        {active.payload.token === 'Empty' ? undefined : (
          <text
            x={x + 10}
            y={y + 10}
            fill="white"
            textAnchor={x > active.cx ? 'start' : 'end'}
            dominantBaseline="central"
          >
            {`${(active.percent * 100).toFixed(0)}%`}
          </text>
        )}
      </g>
    )
  }

  return (
    <Wrapper>
      <ResponsiveContainer width="100%" height="100%">
        {isEmptyData ? (
          <ThemedText.DeprecatedBody color={theme.deprecated_text3} textAlign="center" paddingTop={'80px'}>
            <PieChartIconComponent strokeWidth={1} />
            <div>
              <Trans>No tokens</Trans>
            </div>
          </ThemedText.DeprecatedBody>
        ) : (
          <>
            <PieChart width={300} height={300}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={<RenderCustomizedLabel />}
                outerRadius={130}
                fill="#8884d8"
                dataKey="volume"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </>
        )}
      </ResponsiveContainer>
    </Wrapper>
  )
}

export default Chart
