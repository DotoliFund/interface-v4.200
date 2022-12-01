import { Trans } from '@lingui/macro'
import { Dialog } from '@reach/dialog'
import { useState } from 'react'
export default function Home() {
  const [showDialog, setShowDialog] = useState(false)
  const open = () => setShowDialog(true)
  const close = () => setShowDialog(false)

  return (
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

      <div>
        <button onClick={open}>Open Dialog</button>

        <Dialog isOpen={showDialog} onDismiss={close}>
          <button className="close-button" onClick={close}>
            <Trans>Close</Trans>
            <span aria-hidden>×</span>
          </button>
          <p>Hello there. I am a dialog</p>
        </Dialog>
      </div>
    </div>
  )
}
