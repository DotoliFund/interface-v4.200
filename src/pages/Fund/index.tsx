import * as React from 'react';
import LineChart from '../../components/Chart/LineChart'
import EnhancedTable from '../../components/Table';
import DoughnutChart from '../../components/Chart/DoughnutChart';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));



        // <Route path='/swap' element={<Swap />}/>
        // <Route path='/deposit' element={<Deposit />}/>
        // <Route path='/withdraw' element={<Withdraw />}/>



export default function Fund() {
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <LineChart />
        </Grid>
        <Grid item xs={6}>
          <DoughnutChart />
        </Grid>
      </Grid>
      <EnhancedTable />
    </div>
  );
}