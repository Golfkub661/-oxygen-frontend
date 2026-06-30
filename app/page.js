'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./components/MapInner'), { ssr: false })

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
function pad(n) { return String(n).padStart(2, '0') }

const MOCK_CURRENT = { lat: 13.7563, lng: 100.5018, o2: 85, mgl: 7.2 }
const MOCK_HISTORY = [
  { lat: 13.7550, lng: 100.5000, o2: 45, mgl: 3.8 },
  { lat: 13.7555, lng: 100.5008, o2: 65, mgl: 5.5 },
  { lat: 13.7558, lng: 100.5012, o2: 72, mgl: 6.1 },
  { lat: 13.7563, lng: 100.5018, o2: 85, mgl: 7.2 },
]

// วงกลม Progress ขนาดมินิสำหรับการ์ดรอบมอเตอร์ที่ลดความยาวลง
function CircleGauge({ value, max, color, textColor, size = 26 }) {
  const r = (size / 2) - 3
  const circumference = 2 * Math.PI * r
  const pct = Math.min(Math.max(value / max, 0), 1)
  const offset = circumference * (1 - pct)
  const cx = size / 2
  const cy = size / 2
  const display = value >= 1000 ? value.toFixed(0) : value % 1 === 0 ? value : parseFloat(value).toFixed(1)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx} y={cy + 3}
        textAnchor="middle"
        fontSize={display.toString().length > 3 ? 6.5 : 7.5}
        fontWeight="700"
        fill={textColor}
      >
        {display}
      </text>
    </svg>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [recording, setRecording] = useState(false)
  const [now, setNow] = useState(new Date())
  const [isMounted, setIsMounted] = useState(false)
  const mglCardRef = useRef(null)
  const [mglCardHeight, setMglCardHeight] = useState(null)

  // วัดความสูงจริงของการ์ด mg/L แล้ว sync ให้การ์ด RPM สูงเท่ากัน
  useEffect(() => {
    if (!mglCardRef.current) return
    const el = mglCardRef.current
    const update = () => setMglCardHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMounted])

  useEffect(() => {
    setIsMounted(true)
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/latest/`)
        if (!res.ok) return
        const json = await res.json()
        setData(json)
        setRecording(json.recording ?? false)
      } catch (err) { console.error(err) }
    }
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleRecording = async () => {
    try {
      await fetch(`${API_URL}/api/recording/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: recording ? 'stop' : 'start' }),
      })
      setRecording(!recording)
    } catch (err) { console.error(err) }
  }

  const toggleRelay = async (num, currentState) => {
    await fetch(`${API_URL}/api/relay/${num}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: !currentState }),
    })
  }

  const pzem = {
    voltage: data?.voltage ?? 24.0,
    current: data?.current ?? 30.0,
    power:   data?.power   ?? 500,
    energy:  data?.energy  ?? 1.28,
  }

  // ค่า RPM มอเตอร์สำหรับการ์ดใหม่ด้านขวา
  const rpm = {
    motor_left:  data?.rpm_left  ?? 650,
    motor_right: data?.rpm_right ?? 648,
    motor_drive: data?.rpm_drive ?? 1210,
  }

  if (!isMounted) return <div className="min-h-screen bg-gray-100" />

  return (
    <div className="bg-gray-100 min-h-screen p-3 sm:p-6 w-full">
      {/* 🎯 จำกัดพื้นที่สูงสุดให้กินแค่ 4/5 (80%) ของหน้าจอ และเอา mx-auto ออกเพื่อให้ชิดซ้ายตามปกติ */}
      <div className="w-full sm:max-w-[87%] flex flex-col sm:flex-row gap-4 items-start">

        {/* 📦 กล่องเดิม (ฝั่งซ้ายสัดส่วน w-3/4) */}
        <div className="w-full sm:w-3/4 flex flex-col gap-4">

          {/* ── แถวบน: มอนิเตอร์เซนเซอร์ ── */}
          <div className="flex flex-col sm:grid sm:gap-4" style={{ gridTemplateColumns: '1.8fr 1fr 1.5fr' }}>

            {/* การ์ด 1 — วัน/เวลา + อากาศ */}
            <Card className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-between mb-3 sm:mb-0">
              <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">{days[now.getDay()]}</p>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-gray-500">
                      {now.getDate()} {months[now.getMonth()]} {now.getFullYear() + 543}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg tabular-nums">
                      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-1">
                  <div>
                    <p className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">
                      {data?.temp_air ?? '--'} <span className="text-lg sm:text-xl font-bold text-gray-400">°C</span>
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">อุณหภูมิอากาศ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">
                      {data?.humidity ?? '--'} <span className="text-lg sm:text-xl font-bold text-gray-400">%RH</span>
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">ความชื้นสัมพัทธ์</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* การ์ด 2+3 — น้ำ/O2% */}
            <div className="flex flex-row sm:flex-col gap-3 mb-3 sm:mb-0">
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex flex-col justify-center flex-1">
                <p className="text-xs sm:text-sm font-bold text-blue-700/90 uppercase tracking-wide">อุณหภูมิน้ำ</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-1.5 tracking-tight">
                  {data?.temp ?? '--'} <span className="text-base sm:text-lg font-bold text-blue-500">°C</span>
                </p>
              </div>
              <div className="bg-green-50/80 border border-green-100 rounded-2xl p-4 flex flex-col justify-center flex-1">
                <p className="text-xs sm:text-sm font-bold text-green-700/90 uppercase tracking-wide">ปริมาณออกซิเจน</p>
                <p className="text-2xl sm:text-3xl font-black text-green-900 mt-1.5 tracking-tight">
                  {data?.o2_pct ?? '--'} <span className="text-base sm:text-lg font-bold text-green-500">%</span>
                </p>
              </div>
            </div>

            {/* การ์ด 4 — O2 mg/L */}
            <Card ref={mglCardRef} className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-center mb-3 sm:mb-0">
              <CardContent className="p-0 flex flex-col">
                <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">ปริมาณออกซิเจน</p>
                <div className="flex items-baseline gap-1.5 mt-3">
                  <span className="text-4xl sm:text-6xl font-black text-gray-800 tracking-tighter">
                    {data?.o2_mgl ?? '--'}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-gray-400">mg/L</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── การ์ดพลังงาน PZEM-017 ── */}
          <Card className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-slate-100">
            <CardContent className="p-0 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">⚡ ระบบไฟฟ้า DC (PZEM-017)</span>
                <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 border border-slate-200/80 bg-slate-50/50 shadow-sm rounded-xl p-3">
                  <CircleGauge value={pzem.voltage} max={30} color="#378ADD" textColor="#185FA5" size={44} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">แรงดัน</span>
                    <span className="text-xl sm:text-2xl font-black text-[#185FA5] leading-tight tracking-tight">
                      {pzem.voltage.toFixed(1)} <span className="text-xs sm:text-sm font-bold text-[#378ADD]">V</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">0–30 V</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border border-slate-200/80 bg-slate-50/50 shadow-sm rounded-xl p-3">
                  <CircleGauge value={pzem.current} max={100} color="#1D9E75" textColor="#0F6E56" size={44} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">กระแส</span>
                    <span className="text-xl sm:text-2xl font-black text-[#0F6E56] leading-tight tracking-tight">
                      {pzem.current.toFixed(1)} <span className="text-xs sm:text-sm font-bold text-[#1D9E75]">A</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">0–100 A</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border border-slate-200/80 bg-slate-50/50 shadow-sm rounded-xl p-3">
                  <CircleGauge value={pzem.power} max={1000} color="#EF9F27" textColor="#854F0B" size={44} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">กำลังไฟ</span>
                    <span className="text-xl sm:text-2xl font-black text-[#854F0B] leading-tight tracking-tight">
                      {pzem.power.toFixed(0)} <span className="text-xs sm:text-sm font-bold text-[#EF9F27]">W</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">0–1000 W</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border border-slate-200/80 bg-slate-50/50 shadow-sm rounded-xl p-3">
                  <CircleGauge value={pzem.energy} max={10} color="#10B981" textColor="#047857" size={44} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">พลังงานสะสม</span>
                    <span className="text-xl sm:text-2xl font-black text-[#047857] leading-tight tracking-tight">
                      {pzem.energy.toFixed(2)} <span className="text-xs sm:text-sm font-bold text-[#10B981]">kWh</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">ตั้งแต่เปิดเครื่อง</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Relay + บันทึก ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3].map((num) => {
              const state = data?.[`relay${num}`] ?? false
              return (
                <Card key={num} className="bg-white rounded-2xl shadow-sm p-4">
                  <CardContent className="p-0 flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
                      <div className={cn('w-2.5 h-2.5 rounded-full', state ? 'bg-emerald-500 animate-pulse' : 'bg-red-400')} />
                      <span className="text-sm font-extrabold text-gray-700 uppercase">Relay {num}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleRelay(num, false)}
                        className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-400 hover:bg-emerald-500 active:scale-95 transition-all shadow-sm"
                      >เปิด</button>
                      <button
                        onClick={() => toggleRelay(num, true)}
                        className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-red-400 hover:bg-red-500 active:scale-95 transition-all shadow-sm"
                      >ปิด</button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <Card className={cn('rounded-2xl shadow-sm p-4 transition-colors', recording ? 'bg-green-50/50 border-green-200' : 'bg-white')}>
              <CardContent className="p-0 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
                  <div className={cn('w-2.5 h-2.5 rounded-full', recording ? 'bg-emerald-500 animate-pulse' : 'bg-red-400')} />
                  <span className="text-sm font-extrabold text-gray-700">
                    {recording ? 'กำลังบันทึก' : 'ไม่ได้บันทึก'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleRecording}
                    disabled={recording}
                    className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-400 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
                  >เริ่ม</button>
                  <button
                    onClick={toggleRecording}
                    disabled={!recording}
                    className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-red-400 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
                  >หยุด</button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── แผนที่ GPS ── */}
          <Card className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
            <CardContent className="p-0 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
                  🗺️ แผนที่เส้นทาง & ค่า O₂
                </span>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span> ≥80%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400"></span> ≥50%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span> &lt;50%
                  </span>
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="inline-block w-4 border-t-2 border-dashed border-sky-400"></span> เส้นทาง
                  </span>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: '440px' }}>
                <MapComponent
                  currentPoint={MOCK_CURRENT}
                  trackHistory={MOCK_HISTORY}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* 📦 กล่องฝั่งขวา: การ์ดมอเตอร์กะทัดรัด (ฝั่งขวาสัดส่วน w-1/4) */}
        <div className="w-full sm:w-1/4 flex flex-col">
          <Card
            className="bg-white rounded-2xl shadow-sm p-3.5 border border-slate-100 flex flex-col justify-between"
            style={mglCardHeight ? { height: mglCardHeight } : undefined}
          >
            <CardContent className="p-0 flex flex-col gap-1.5">
              <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-0.5">
                ⚙️ ความเร็วรอบมอเตอร์ (RPM)
              </div>
              
              <div className="flex flex-col gap-1.5">
                {/* มอเตอร์ซ้าย */}
                <div className="flex items-center justify-between bg-slate-50/70 py-1 px-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <CircleGauge value={rpm.motor_left} max={2500} color="#0EA5E9" textColor="#0369A1" size={26} />
                    <span className="text-[11px] font-bold text-slate-600">มอเตอร์ฝั่งซ้าย</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 tabular-nums bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-2xs">
                    {rpm.motor_left} <span className="text-[8px] font-normal text-gray-400">rpm</span>
                  </span>
                </div>

                {/* มอเตอร์ขวา */}
                <div className="flex items-center justify-between bg-slate-50/70 py-1 px-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <CircleGauge value={rpm.motor_right} max={2500} color="#0EA5E9" textColor="#0369A1" size={26} />
                    <span className="text-[11px] font-bold text-slate-600">มอเตอร์ฝั่งขวา</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 tabular-nums bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-2xs">
                    {rpm.motor_right} <span className="text-[8px] font-normal text-gray-400">rpm</span>
                  </span>
                </div>

                {/* มอเตอร์ขับเคลื่อน */}
                <div className="flex items-center justify-between bg-purple-50/50 py-1 px-2.5 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2">
                    <CircleGauge value={rpm.motor_drive} max={2500} color="#8B5CF6" textColor="#6D28D9" size={26} />
                    <span className="text-[11px] font-bold text-purple-700">มอเตอร์ระบบขับเคลื่อน</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-800 tabular-nums bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-2xs">
                    {rpm.motor_drive} <span className="text-[8px] font-normal text-gray-400">rpm</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}