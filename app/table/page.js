'use client'

import { useState, useEffect } from 'react'
import SessionControl from '../components/SessionControl'
import TableView from '../components/TableView'

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

export default function TablePage() {
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/`)
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch { }
  }

  useEffect(() => { fetchSessions() }, [])

  const handleSessionChange = (session) => {
    fetchSessions()
    setSelectedId(session.id)
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 flex flex-col gap-4 max-w-7xl mx-auto">

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-gray-800">📋 Table Mode</h1>
        <a href="/" className="text-xs font-bold text-blue-500 hover:underline">← กลับ Dashboard</a>
      </div>

      {/* SessionControl */}
      <SessionControl onSessionChange={handleSessionChange} />

      {/* รายการ session */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
        <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
          📁 ประวัติการทดลอง
        </h2>
        {sessions.length === 0 ? (
          <p className="text-xs text-gray-400 font-bold">ยังไม่มีการทดลอง</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedId === s.id
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span>{s.name}</span>
                  <span className="ml-auto text-gray-400 font-normal">{s.start_time}</span>
                  <span className="text-gray-400 font-normal">{s.reading_count} แถว</span>
                </div>
                {s.condition && <p className="text-gray-400 font-normal mt-1 ml-4">{s.condition}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ตารางข้อมูล */}
      <TableView sessionId={selectedId} />
    </div>
  )
}