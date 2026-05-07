import { useState, useRef } from 'react'
import type { Player, Position, FootPreference, PlayerStatus } from '@/types'
import { generateId, POSITION_LABELS, STATUS_LABELS } from '@/utils'
import { X, Camera, Plus, Minus } from 'lucide-react'

interface PlayerFormProps {
  player?: Player
  onSave: (player: Player) => void
  onClose: () => void
}

const defaultAttrs = () => ({
  shooting: 60, passing: 60, dribbling: 60, firstTouch: 60,
  pace: 60, stamina: 60, strength: 60, agility: 60,
  aggression: 60, teamwork: 60, discipline: 60, leadership: 60,
  positioning: 60, decisions: 60, vision: 60, anticipation: 60,
})

function AttrSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ color: '#999', fontSize: 11, width: 52, flexShrink: 0 }}>{label}</span>
      <input
        type="range" min={1} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, height: 4, accentColor: '#F7FF19', background: 'transparent', border: 'none', padding: 0 }}
      />
      <span style={{ color: '#F7FF19', fontWeight: 700, fontSize: 12, width: 26, textAlign: 'right' }}>{value}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        <button onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 18, height: 18, background: '#333', border: 'none', borderRadius: 3, color: '#aaa', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
        <button onClick={() => onChange(Math.min(100, value + 1))} style={{ width: 18, height: 18, background: '#333', border: 'none', borderRadius: 3, color: '#aaa', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>
    </div>
  )
}

export default function PlayerForm({ player, onSave, onClose }: PlayerFormProps) {
  const isEdit = !!player
  const [name, setName] = useState(player?.name || '')
  const [number, setNumber] = useState(player?.number || 0)
  const [age, setAge] = useState(player?.age || 20)
  const [height, setHeight] = useState(player?.height || 175)
  const [weight, setWeight] = useState(player?.weight || 70)
  const [positions, setPositions] = useState<Position[]>(player?.positions || ['MID'])
  const [preferredFoot, setPreferredFoot] = useState<FootPreference>(player?.preferredFoot || 'RIGHT')
  const [status, setStatus] = useState<PlayerStatus>(player?.status || 'MATCH_FIT')
  const [avatar, setAvatar] = useState<string | null>(player?.avatar || null)
  const [notes, setNotes] = useState(player?.notes || '')
  const [attrs, setAttrs] = useState(player?.attributes ? { ...player.attributes } : defaultAttrs())
  const [activeTab, setActiveTab] = useState<'basic' | 'attrs'>('basic')
  const fileRef = useRef<HTMLInputElement>(null)

  const togglePosition = (pos: Position) => {
    if (positions.includes(pos)) {
      if (positions.length > 1) setPositions(p => p.filter(x => x !== pos))
    } else {
      setPositions(p => [...p, pos])
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const maxW = 200, maxH = 200
        let w = img.width, h = img.height
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        setAvatar(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!name.trim()) return alert('请填写球员姓名')
    const now = new Date().toISOString()
    const saved: Player = {
      id: player?.id || generateId(),
      name: name.trim(),
      number,
      age,
      height,
      weight,
      positions,
      preferredFoot,
      avatar,
      attributes: attrs,
      status,
      joinedAt: player?.joinedAt || now,
      notes,
      createdAt: player?.createdAt || now,
      updatedAt: now,
    }
    onSave(saved)
  }

  const setAttr = (key: keyof typeof attrs, val: number) => setAttrs(a => ({ ...a, [key]: val }))

  const inputStyle: React.CSSProperties = {
    background: '#222', border: '1px solid #333', color: '#f0f0f0',
    borderRadius: 6, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, color: '#666', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: 12, width: '100%', maxWidth: 560,
        border: '1px solid #333', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#F7FF19', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isEdit ? '编辑球员' : '添加球员'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
          {(['basic', 'attrs'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: activeTab === tab ? '#F7FF19' : '#555',
              borderBottom: activeTab === tab ? '2px solid #F7FF19' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              {tab === 'basic' ? '基础信息' : '属性评分'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'basic' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
                    background: avatar ? 'transparent' : '#222',
                    border: '2px dashed #444', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', overflow: 'hidden', position: 'relative',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Camera size={20} color="#555" />
                      <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>上传头像</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              </div>

              {/* Name + Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
                <div>
                  <label style={labelStyle}>姓名 *</label>
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="球员姓名" />
                </div>
                <div>
                  <label style={labelStyle}>号码</label>
                  <input style={inputStyle} type="number" min={0} max={99} value={number} onChange={e => setNumber(Number(e.target.value))} />
                </div>
              </div>

              {/* Age Height Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>年龄</label>
                  <input style={inputStyle} type="number" min={15} max={50} value={age} onChange={e => setAge(Number(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>身高(cm)</label>
                  <input style={inputStyle} type="number" min={140} max={220} value={height} onChange={e => setHeight(Number(e.target.value))} />
                </div>
                <div>
                  <label style={labelStyle}>体重(kg)</label>
                  <input style={inputStyle} type="number" min={40} max={130} value={weight} onChange={e => setWeight(Number(e.target.value))} />
                </div>
              </div>

              {/* Positions */}
              <div>
                <label style={labelStyle}>位置（可多选）</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map(pos => {
                    const colors = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#22c55e', FWD: '#ef4444' }
                    const active = positions.includes(pos)
                    return (
                      <button key={pos} onClick={() => togglePosition(pos)} style={{
                        padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                        border: `1px solid ${active ? colors[pos] : '#333'}`,
                        background: active ? `${colors[pos]}22` : 'transparent',
                        color: active ? colors[pos] : '#555',
                        transition: 'all 0.15s',
                      }}>{pos}</button>
                    )
                  })}
                </div>
              </div>

              {/* Foot + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>惯用脚</label>
                  <select style={inputStyle} value={preferredFoot} onChange={e => setPreferredFoot(e.target.value as FootPreference)}>
                    <option value="RIGHT">右脚</option>
                    <option value="LEFT">左脚</option>
                    <option value="BOTH">双脚</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>状态</label>
                  <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as PlayerStatus)}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>备注</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="可选备注..." />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#F7FF19', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>⚽ 技术</div>
                <AttrSlider label="射门" value={attrs.shooting} onChange={v => setAttr('shooting', v)} />
                <AttrSlider label="传球" value={attrs.passing} onChange={v => setAttr('passing', v)} />
                <AttrSlider label="盘带" value={attrs.dribbling} onChange={v => setAttr('dribbling', v)} />
                <AttrSlider label="停球" value={attrs.firstTouch} onChange={v => setAttr('firstTouch', v)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>💪 身体</div>
                <AttrSlider label="速度" value={attrs.pace} onChange={v => setAttr('pace', v)} />
                <AttrSlider label="体能" value={attrs.stamina} onChange={v => setAttr('stamina', v)} />
                <AttrSlider label="力量" value={attrs.strength} onChange={v => setAttr('strength', v)} />
                <AttrSlider label="敏捷" value={attrs.agility} onChange={v => setAttr('agility', v)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>🔥 态度</div>
                <AttrSlider label="拼抢" value={attrs.aggression} onChange={v => setAttr('aggression', v)} />
                <AttrSlider label="配合" value={attrs.teamwork} onChange={v => setAttr('teamwork', v)} />
                <AttrSlider label="纪律" value={attrs.discipline} onChange={v => setAttr('discipline', v)} />
                <AttrSlider label="领导力" value={attrs.leadership} onChange={v => setAttr('leadership', v)} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>🧠 意识</div>
                <AttrSlider label="站位" value={attrs.positioning} onChange={v => setAttr('positioning', v)} />
                <AttrSlider label="决策" value={attrs.decisions} onChange={v => setAttr('decisions', v)} />
                <AttrSlider label="视野" value={attrs.vision} onChange={v => setAttr('vision', v)} />
                <AttrSlider label="预判" value={attrs.anticipation} onChange={v => setAttr('anticipation', v)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 6, border: '1px solid #333',
            background: 'transparent', color: '#888', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>取消</button>
          <button onClick={handleSave} style={{
            padding: '8px 24px', borderRadius: 6, border: 'none',
            background: '#F7FF19', color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: 13,
          }}>
            {isEdit ? '保存修改' : '添加球员'}
          </button>
        </div>
      </div>
    </div>
  )
}
