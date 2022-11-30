import { Trans } from '@lingui/macro'
import { Dialog } from '@reach/dialog'
import { useState } from 'react'
export default function Home() {
  const [showDialog, setShowDialog] = useState(false)
  const open = () => setShowDialog(true)
  const close = () => setShowDialog(false)

  return (
    <div>
      <Trans>Govornance</Trans>

      <div style={{ width: 200 }}>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</div>

      <Trans>button text</Trans>

      <div>
        <button onClick={open}>Open Dialog</button>
        <button
          onClick={() =>
            window.open('https://www.tally.xyz/gov/eip155:5:0xfbD4900923647c69941c0819B410E3e44c9d024B/proposals')
          }
        >
          Tally
        </button>

        <Dialog isOpen={showDialog} onDismiss={close}>
          <button className="close-button" onClick={close}>
            <Trans>Close</Trans>
            <span aria-hidden>×</span>
          </button>
          <p>Hello there. I am a Govornance</p>
        </Dialog>
      </div>
    </div>
  )
}
