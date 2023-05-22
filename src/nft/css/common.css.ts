import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from './sprinkles.css'

// TYPOGRAPHY
export const header1 = sprinkles({ fontWeight: 'normal', fontSize: '36' })
export const header2 = sprinkles({ fontWeight: 'normal', fontSize: '28' })
export const subhead = sprinkles({ fontWeight: 'medium', fontSize: '16' })
export const subheadSmall = sprinkles({ fontWeight: 'medium', fontSize: '14' })
export const body = sprinkles({ fontSize: '16' })
export const bodySmall = sprinkles({
  fontSize: '14',
})

export const buttonTextMedium = sprinkles({ fontWeight: 'medium', fontSize: '16' })
export const buttonMedium = style([
  buttonTextMedium,
  sprinkles({
    backgroundColor: 'blue',
    borderRadius: '12',
    color: 'explicitWhite',
    transition: '250',
    boxShadow: { hover: 'elevation' },
  }),
  {
    cursor: 'pointer',
    padding: '14px 18px',
    border: 'none',
    ':hover': {
      cursor: 'pointer',
    },
    ':disabled': {
      cursor: 'auto',
      opacity: '0.3',
    },
  },
])

export const lightGrayOverlayOnHover = style([
  sprinkles({
    transition: '250',
  }),
  {
    ':hover': {
      background: vars.color.lightGrayOverlay,
    },
  },
])
