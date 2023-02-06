import { Trans } from '@lingui/macro'
import Web3Status from 'components/Web3Status'
import { VOTE_URL } from 'constants/addresses'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { UniIcon } from 'nft/components/icons'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation } from 'react-router-dom'

import { ChainSelector } from './ChainSelector'
import { MenuDropdown } from './MenuDropdown'
import * as styles from './style.css'

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
}

const MenuItem = ({ href, id, isActive, children }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none' }}
    >
      {children}
    </NavLink>
  )
}

const PageTabs = () => {
  const { pathname } = useLocation()

  return (
    <>
      <MenuItem href="/home" isActive={pathname.startsWith('/home')}>
        <Trans>Home</Trans>
      </MenuItem>
      <MenuItem href="/overview" isActive={pathname.startsWith('/overview')}>
        <Trans>Overview</Trans>
      </MenuItem>
      <MenuItem href={'/account'} isActive={pathname.startsWith('/account')}>
        <Trans>My Account</Trans>
      </MenuItem>
      <MenuItem href="/staking">
        <Trans>Staking</Trans>
      </MenuItem>
      <MenuItem href={pathname}>
        <div
          onClick={() => {
            window.open(VOTE_URL)
          }}
          style={{ width: '8px' }}
        >
          <Trans>Vote</Trans>
        </div>
      </MenuItem>
    </>
  )
}

const Navbar = () => {
  return (
    <>
      <nav className={styles.nav}>
        <Box display="flex" height="full" flexWrap="nowrap" alignItems="stretch">
          <Box className={styles.leftSideContainer}>
            <Box as="a" href="#/swap" className={styles.logoContainer}>
              <UniIcon width="48" height="48" className={styles.logo} />
            </Box>
            <Box display={{ sm: 'flex', lg: 'none' }}>
              <ChainSelector leftAlign={true} />
            </Box>
            <Row gap="8" display={{ sm: 'none', lg: 'flex' }}>
              <PageTabs />
            </Row>
          </Box>
          <Box className={styles.middleContainer}></Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box display={{ sm: 'flex', xl: 'none' }}></Box>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <MenuDropdown />
              </Box>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <ChainSelector />
              </Box>
              <Web3Status />
            </Row>
          </Box>
        </Box>
      </nav>
      <Box className={styles.mobileBottomBar}>
        <PageTabs />
        <Box marginY="4">
          <MenuDropdown />
        </Box>
      </Box>
    </>
  )
}

export default Navbar
