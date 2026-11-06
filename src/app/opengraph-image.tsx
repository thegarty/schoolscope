import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const alt = 'SchoolScope — Big questions. Little lightbulbs.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logo = await readFile(path.join(process.cwd(), 'public/brand/ripple-mark.png'))
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff9e6', color: '#342248', padding: 70 }}>
    <img src={`data:image/png;base64,${logo.toString('base64')}`} width={235} height={310} alt="" style={{ objectFit: 'contain', marginRight: 48 }} />
    <div style={{ display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', fontSize: 74, fontWeight: 700, letterSpacing: -4 }}>School<span style={{ color: '#7046d4' }}>Scope</span></div><div style={{ fontSize: 36, marginTop: 24 }}>Big questions.</div><div style={{ fontSize: 36, color: '#7046d4', marginTop: 8 }}>Little lightbulbs.</div></div>
  </div>, size)
}
