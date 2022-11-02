import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'

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
      <div>
        <Trans>h1. Heading</Trans>
        <Trans>h2. Heading</Trans>
        <Trans>h3. Heading</Trans>
        <Trans>h4. Heading</Trans>
        <Trans>h5. Heading</Trans>
        <Trans>h6. Heading</Trans>

        <div style={{ width: 200 }}>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</div>
        <div style={{ width: 200 }}>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</div>

        <Trans>button text</Trans>
        <Trans>caption text</Trans>
        <Trans>overline text</Trans>
      </div>
    </MainWrapper>
  )
}
