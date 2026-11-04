'use client'

import { useState } from 'react'

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

export default function SessionControl({ onSessionChange }) {
  const [name, setName] = useState('')
  const [condition, setCondition] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (!name.trim()) { setError('กรุณาระบุชื่อการทดลอง'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/sessions/start/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, condition }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return }
      setSession(data)
      onSessionChange?.(data)
    } catch { setError('เชื่อมต่อ server ไม่ได้') }
    finally { setLoading(false) }
  }

  const handleStop = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/sessions/stop/`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return }
      setSession(data)
      onSessionChange?.(data)
    } catch { setError('เชื่อมต่อ server ไม่ได้') }
    finally { setLoading(false) }
  }

  const isRunning = session?.status === 'running'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
      <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
        🧪 ควบคุมการทดลอง
      </h2>

      {/* ฟอร์ม */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="ชื่อการทดลอง *"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isRunning}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <textarea
          placeholder="เงื่อนไขการทดลอง"
          value={condition}
          onChange={e => setCondition(e.target.value)}
          disabled={isRunning}
          rows={2}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
        />
      </div>

      {/* สถานะ */}
      {session && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-2 ${
          isRunning ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          {isRunning ? `กำลังบันทึก: ${session.name}` : `หยุดแล้ว: ${session.name}`}
          {session.start_time && <span className="ml-auto text-xs font-normal">{session.start_time}</span>}
        </div>
      )}

      {/* error */}
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

      {/* ปุ่ม */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleStart}
          disabled={isRunning || loading}
          className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-400 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
        >
          ▶ เริ่มการทดลอง
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning || loading}
          className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-red-400 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
        >
          ■ หยุดการทดลอง
        </button>
      </div>
    </div>
  )
}