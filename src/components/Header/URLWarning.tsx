import React from 'react'
import styled from 'styled-components'

import { AlertTriangle, X } from 'react-feather'
import { useURLWarningToggle } from '../../state/user/hooks'
// import { useURLWarningToggle, useURLWarningVisible } from '../../state/user/hooks'
import { isMobile } from 'react-device-detect'

const PhishAlert = styled.div<{ isActive: any }>`
  width: 100%;
  padding: 6px 6px;
  background-color: ${({ theme }) => theme.red2};
  color: white;
  font-size: 11px;
  justify-content: space-between;
  align-items: center;
  display: ${({ isActive }) => (isActive ? 'flex' : 'none')};
`

export const StyledClose = styled(X)`
  :hover {
    cursor: pointer;
  }
`

export default function URLWarning() {
  const toggleURLWarning = useURLWarningToggle()
  const showURLWarning = true
  // const showURLWarning = useURLWarningVisible()

  return isMobile ? (
    <PhishAlert isActive={showURLWarning}>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} /> This is a testing environment. Do not send any real
        tokens - you could lose them.
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  ) : (
    <PhishAlert isActive={showURLWarning}>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} /> This is a testing environment. Do not send any real
        tokens - you could lose them.
      </div>
      {/* <StyledClose size={12} onClick={toggleURLWarning} /> */}
    </PhishAlert>
  )
}
