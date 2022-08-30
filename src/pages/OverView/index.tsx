import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import React from 'react'

import DoughnutChart from '../../components/Chart/DoughnutChart'
import LineChart from '../../components/Chart/LineChart'
import EnhancedTable from '../../components/Table'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}))

export default function OverView() {
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <LineChart />
        </Grid>
        <Grid item xs={4}>
          <LineChart />
        </Grid>
        <Grid item xs={4}>
          <DoughnutChart />
        </Grid>
      </Grid>
      <EnhancedTable />
    </div>
  )
}
