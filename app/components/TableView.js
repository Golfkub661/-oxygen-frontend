'use client'

import { useState, useEffect } from 'react'

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

const HEADERS = [
  'เวลา', 'Latitude', 'Longitude',
  'O₂(%)', 'O₂(mg/L)',
  'อุณหภูมิน้ำ(°C)', 'อุณหภูมิอากาศ(°C)', 'ความชื้น(%)',
  'แรงดัน(V)', 'กระแส(A)', 'กำลัง(W)', 'พลังงาน(Wh)',
  'RPM ซ้าย', 'RPM ขวา', 'RPM หลัง',
]

const KEYS = [
  'timestamp', 'latitude', 'longitude',
  'o2_pct', 'o2_mgl',
  'temp_water', 'temp_air', 'humidity',
  'pzem_voltage', 'pzem_current', 'pzem_power', 'pzem_energy',
  'rpm1', 'rpm2', 'rpm3',
]

function avg(rows, key) {
  const vals = rows.map(r => r[key]).filter(v => v != null && !isNaN(v))
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
}

export default function TableView({ sessionId }) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sessionInfo, setSessionInfo] = useState(null)
  const PAGE_SIZE = 50

  useEffect(() => {
    if (!sessionId) return
    fetch(`${API_URL}/api/sessions/${sessionId}/readings/?page=${page}&page_size=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(data => {
        setRows(data.readings || [])
        setTotal(data.total || 0)
        setSessionInfo(data.session)
      })
      .catch(console.error)
  }, [sessionId, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const exportExcel = () => {
    if (!rows.length) return
    const header = HEADERS.join('\t')
    const body = rows.map(r => KEYS.map(k => r[k] ?? '').join('\t')).join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `session_${sessionId}.tsv`
    a.click()
  }

  if (!sessionId) return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm font-bold">
      เลือก session เพื่อดูข้อมูล
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">

      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
            📊 ข้อมูลการทดลอง {sessionInfo && `— ${sessionInfo.name}`}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">ทั้งหมด {total} แถว</p>
        </div>
        <button
          onClick={exportExcel}
          className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all"
        >
          ⬇ Export Excel
        </button>
      </div>

      {/* ตาราง */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-2 py-2 text-left font-bold text-gray-500">#</th>
              {HEADERS.map(h => (
                <th key={h} className="px-2 py-2 text-left font-bold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-2 py-1.5 text-gray-400 font-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                {KEYS.map(k => (
                  <td key={k} className="px-2 py-1.5 text-gray-700 whitespace-nowrap font-mono">
                    {row[k] ?? <span className="text-gray-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}

            {/* แถวค่าเฉลี่ย */}
            {rows.length > 0 && (
              <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                <td className="px-2 py-1.5 text-blue-600 font-bold">avg</td>
                <td className="px-2 py-1.5 text-blue-600 text-xs">—</td>
                {KEYS.slice(1).map(k => (
                  <td key={k} className="px-2 py-1.5 text-blue-700 whitespace-nowrap font-mono">
                    {['timestamp'].includes(k) ? '—' : (avg(rows, k) ?? '—')}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-30">
            ← ก่อนหน้า
          </button>
          <span className="text-xs font-bold text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-30">
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  )
}