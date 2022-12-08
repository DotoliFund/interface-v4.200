import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
const RADIAN = Math.PI / 180

export type PieChartProps = {
  data: any[]
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({ data }: PieChartProps) => {
  if (!data || data.length === 0) {
    data = [
      {
        token: 'Empty',
        symbol: 'Empty',
        tokenVolume: 1,
      },
    ]
  }
  const RenderCustomizedLabel = (active: any) => {
    const radius = active.innerRadius + (active.outerRadius - active.innerRadius) * 0.5
    const x = active.cx + radius * Math.cos(-active.midAngle * RADIAN)
    const y = active.cy + radius * Math.sin(-active.midAngle * RADIAN)

    return (
      <g>
        <text x={x + 5} y={y - 10} fill="white" textAnchor={x > active.cx ? 'start' : 'end'} dominantBaseline="central">
          {`${active.payload.symbol}`}
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
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={<RenderCustomizedLabel />}
          outerRadius={110}
          fill="#8884d8"
          dataKey="tokenVolume"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

export default Chart
