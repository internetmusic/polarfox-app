import {useLayoutEffect, useState} from 'react'
import {shade} from 'polished'
import Vibrant from 'node-vibrant'
import {hex} from 'wcag-contrast'
import {Token} from '@polarfox/sdk'

async function getColorFromToken(token: Token): Promise<string | null> {
  //const path = `https://raw.githubusercontent.com/Polarfox-DEX/polarfox-token-lists/master/43113/token-logos/${token.address}.png`
  const path = `https://raw.githubusercontent.com/internetmusic/copyright-token-lists/master/43113/token-logos/${token.address}.png`
  return Vibrant.from(path)
    .getPalette()
    .then(palette => {
      if (palette?.Vibrant) {
        let detectedHex = palette.Vibrant.hex
        let AAscore = hex(detectedHex, '#FFF')
        while (AAscore < 3) {
          detectedHex = shade(0.005, detectedHex)
          AAscore = hex(detectedHex, '#FFF')
        }
        return detectedHex
      }
      return null
    })
    .catch(() => null)
}

export function useColor(token?: Token) {
  const [color, setColor] = useState('#2172E5')

  useLayoutEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token).then(tokenColor => {
        if (!stale && tokenColor !== null) {
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor('#2172E5')
    }
  }, [token])

  return color
}
