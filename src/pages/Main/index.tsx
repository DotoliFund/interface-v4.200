import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/system'
import * as React from 'react'

const MainWrapper = styled('div')({
  color: 'white',
  padding: 8,
  borderRadius: 4,
  flexDirection: 'column',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export default function Main() {
  return (
    <MainWrapper>
      <Box sx={{ width: '100%', maxWidth: 500 }}>
        <Typography variant="h1" component="div" gutterBottom>
          h1. Heading
        </Typography>
        <Typography variant="h2" gutterBottom component="div">
          h2. Heading
        </Typography>
        <Typography variant="h3" gutterBottom component="div">
          h3. Heading
        </Typography>
        <Typography variant="h4" gutterBottom component="div">
          h4. Heading
        </Typography>
        <Typography variant="h5" gutterBottom component="div">
          h5. Heading
        </Typography>
        <Typography variant="h6" gutterBottom component="div">
          h6. Heading
        </Typography>

        <Box style={{ width: 200 }} component="div" sx={{ whiteSpace: 'nowrap' }}>
          Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
        </Box>
        <Box style={{ width: 200 }} component="div" sx={{ whiteSpace: 'normal' }}>
          Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
        </Box>

        <Typography variant="button" display="block" gutterBottom>
          button text
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          caption text
        </Typography>
        <Typography variant="overline" display="block" gutterBottom>
          overline text
        </Typography>
      </Box>
    </MainWrapper>
  )
}
