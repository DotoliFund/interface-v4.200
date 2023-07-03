import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from './sprinkles.css'

// TYPOGRAPHY
export const subhead = sprinkles({ fontWeight: 'medium', fontSize: '16' })
export const subheadSmall = sprinkles({ fontWeight: 'medium', fontSize: '14' })
export const body = sprinkles({ fontSize: '16' })
export const bodySmall = sprinkles({
  fontSize: '14',
})

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
