import { useState, useEffect } from 'react'

export default function StorageIndicator() {
  const [used, setUsed] = useState<number>(0)
  const MAX = 5 * 1024 * 1024

  useEffect(() => {
    const calc = () => {
      let total = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key)
          total += (key.length + (val ? val.length : 0)) * 2
        }
      }
      setUsed(total)
    }
    calc()
    window.addEventListener('storage', calc)
    return () => window.removeEventListener('storage', calc)
  }, [])

  const pct = (used / MAX) * 100
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e'
  const mb = (used / 1024 / 1024).toFixed(1)
  const totalMb = (MAX / 1024 / 1024).toFixed(0)

  return (
    <div style={{ fontSize: 10, color: '#2a2a2a', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>存储</span>
      <div style={{ width: 60, height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ color }}>{mb}MB / {totalMb}MB</span>
    </div>
  )
}
