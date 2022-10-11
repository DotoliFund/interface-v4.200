import React from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Wrapper = styled(ThemedText.DeprecatedMain)<{
  fontWeight: number
  fontSize: string
  negative: boolean
  neutral: boolean
}>`
  font-size: ${({ fontSize }) => fontSize};
  font-weight: ${({ fontWeight }) => fontWeight};
  color: ${({ theme, negative }) => (negative ? theme.deprecated_red1 : theme.deprecated_green1)};
`

export interface LogoProps {
  value: number | undefined
  decimals?: number
  fontSize?: string
  fontWeight?: number
  wrap?: boolean
  simple?: boolean
}

export default function Percent({
  value,
  decimals = 2,
  fontSize = '16px',
  fontWeight = 500,
  wrap = false,
  simple = false,
  ...rest
}: LogoProps) {
  if (value === undefined || value === null) {
    return (
      <ThemedText.DeprecatedMain fontWeight={fontWeight} fontSize={fontSize}>
        -
      </ThemedText.DeprecatedMain>
    )
  }

  const truncated = parseFloat(value.toFixed(decimals))

  if (simple) {
    return (
      <Wrapper {...rest} fontWeight={fontWeight} fontSize={fontSize} negative={false} neutral={true}>
        {Math.abs(value).toFixed(decimals)}%
      </Wrapper>
    )
  }

  return (
    <Wrapper {...rest} fontWeight={fontWeight} fontSize={fontSize} negative={truncated < 0} neutral={truncated === 0}>
      {wrap && '('}
      {truncated < 0 && '↓'}
      {truncated > 0 && '↑'}
      {Math.abs(value).toFixed(decimals)}%{wrap && ')'}
    </Wrapper>
  )
}
