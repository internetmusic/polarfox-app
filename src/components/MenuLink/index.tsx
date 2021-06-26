import React, { useRef } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { useLocation } from 'react-router-dom'

import { StyledInternalLink, MEDIA_WIDTHS } from '../../theme'

// display: flex;
const MenuFlyout = styled.span<{ positionDesktop: string; positionMobile: string }>`
  display: none;
  min-width: 4rem;
  background-color: ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 0.5rem;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 1.2rem;
  right: ${p => p.positionDesktop}rem;
  z-index: 100;
  text-align: center;

  @media only screen and (max-width: ${MEDIA_WIDTHS.upToExtraSmall}px) {
    right: ${p => p.positionMobile}rem;
  }
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;

  :hover ${MenuFlyout} {
    display: flex;
  }
`

const activeClassName = 'ACTIVE'
const StyledMenuLinkButton = styled.div.attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const MenuItem = styled(StyledInternalLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

interface MenuLinkProps {
  links: {
    linkRef: string
    linkTitle: string
  }[]
  label: string
  flyoutPositionDesktop: string
  flyoutPositionMobile: string
}

export default function MenuLink({ links, label, flyoutPositionDesktop, flyoutPositionMobile }: MenuLinkProps) {
  const node = useRef<HTMLDivElement>()

  const location = useLocation()
  const isActive = links.map(link => link.linkRef).find(linkRef => location.pathname.includes(linkRef))

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuLinkButton className={isActive ? 'ACTIVE' : ''}>{label}</StyledMenuLinkButton>
      <MenuFlyout positionDesktop={flyoutPositionDesktop} positionMobile={flyoutPositionMobile}>
        {links.map(link => {
          return (
            <MenuItem key={link.linkRef} id="link" to={link.linkRef}>
              {link.linkTitle}
            </MenuItem>
          )
        })}
      </MenuFlyout>
    </StyledMenu>
  )
}
