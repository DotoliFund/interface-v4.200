import Link from '@mui/material/Link'
import React from 'react'

import { CustomButton } from '../../components/Button'

export default function Option({
  link = null,
  clickable = true,
  size,
  onClick,
  color,
  header,
  subheader,
  icon,
  isActive = false,
  id,
}: {
  link?: string | null
  clickable?: boolean
  size?: number | null
  onClick?: (() => void) | React.MouseEventHandler<HTMLButtonElement>
  color: string
  header: React.ReactNode
  subheader?: React.ReactNode
  icon: string
  isActive?: boolean
  id: string
}) {
  const content = (
    <>
      <CustomButton onClick={onClick} disabled={isActive}>
        {header}
        <img src={icon} alt={'Icon'} />
      </CustomButton>
    </>
  )
  if (link) {
    return <Link href={link}>{content}</Link>
  }

  return content
}
