'use client'

import { useState, useEffect } from 'react'
import { Droplets, Thermometer, Wind } from 'lucide-react'
import { MaskReveal } from '@/components/ui/mask-reveal'
import { ChallengeCard } from '@/components/ui/card-9'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalibrateSuccess } from '@/components/ui/calibrate-success' // ← จุดที่ 1

const API = 'https://oxygen-dashboard-6wgh.onrender.com'

const CARDS = [
  {
    id: 'o2_pct',
    label: 'ออกซิเจน',
    unit: '%',
    icon: Wind,
    gradient: 'from-blue-500 to-cyan-400',
    delay: 0,
  },
  {
    id: 'o2_mgl',
    label: 'ออกซิเจน',
    unit: 'mg/L',
    icon: Droplets,
    gradient: 'from-cyan-500 to-teal-400',
    delay: 0.15,
  },
  {
    id: 'temp',
    label: 'อุณหภูมิน้ำ',
    unit: '°C',
    icon: Thermometer,
    gradient: 'from-orange-400 to-amber-300',
    delay: 0.3,
  },
]

// ==================== CALIBRATION CONFIG ====================

const CAL_CONFIG = {
  SAT: {
    icon: '🌬️',
    title: 'Calibrate SAT 100%',
    steps: [
      'ยก sensor ขึ้นในอากาศ ห่างจากพื้น 50 ซม.',
      'รอให้ค่านิ่ง ประมาณ 1-2 นาที',
      'กด "เริ่ม Calibrate" เมื่อพร้อมแล้ว',
    ],
  },
  ZERO: {
    icon: '🧪',
    title: 'Calibrate ZERO 0%',
    steps: [
      'จุ่ม sensor ในน้ำยา Na₂SO₃',
      'รอให้ค่านิ่ง ประมาณ 1-2 นาที',
      'กด "เริ่ม Calibrate" เมื่อพร้อมแล้ว',
    ],
  },
}

// ==================== CALIBRATION ADVICE ====================

function getAdvice(reason = '') {
  if (reason.includes('Stable timeout'))      return 'ตรวจสอบว่า sensor อยู่นิ่ง ไม่มีการสั่น'
  if (reason.includes('out of range 95-105')) return 'ยก sensor ให้สูงกว่านี้ ห่างจากน้ำ'
  if (reason.includes('>= 0.5'))              return 'เปลี่ยนน้ำยา Na₂SO₃ ใหม่'
  if (reason.includes('Modbus'))              return 'ตรวจสอบสาย RS485'
  if (reason.includes('read error'))          return 'ตรวจสอบการเชื่อมต่อ sensor'
  return 'ตรวจสอบอุปกรณ์และลองใหม่'
}

// ==================== INITIAL STATE ====================

const INITIAL_CAL_STATE = {
  phase:      'idle',
  progress:   0,
  total:      0,
  value:      0,
  status:     null,
  reason:     '',
  finalValue: 0,
  type:       null, // ← เก็บ type ไว้ให้ CalibrateSuccess ใช้
}

// ==================== SENSOR CARD ====================

function SensorCard({ card, value }) {
  const Icon = card.icon

  return (
    <MaskReveal
      direction="left"
      zoom
      delay={card.delay}
      duration={0.8}
      className="rounded-2xl w-full sm:flex-1 min-w-0 sm:min-w-[140px]"
    >
      <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 h-full text-white`}>
        <div className="flex items-center gap-2 opacity-80 mb-3">
          <Icon className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            {card.label}
          </span>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold leading-none tabular-nums">
            {value !== null && value !== undefined
              ? Number(value).toFixed(1)
              : '—'}
          </span>
          <span className="text-sm font-medium opacity-70 mb-1">
            {card.unit}
          </span>
        </div>
      </div>
    </MaskReveal>
  )
}

// ==================== MAIN PAGE ====================

export default function CalibratePage() {

  const [sensor, setSensor] = useState({
    o2_pct: null,
    o2_mgl: null,
    temp:   null,
  })

  const [dialogType,  setDialogType]  = useState(null)
  const [calState,    setCalState]    = useState(INITIAL_CAL_STATE)
  const [isPolling,   setIsPolling]   = useState(false)
  const [isStarting,  setIsStarting]  = useState(false)
  const [showSuccess, setShowSuccess] = useState(false) // ← จุดที่ 2

  // ==================== FETCH SENSOR ====================

  useEffect(() => {
    const fetchSensor = async () => {
      try {
        const res  = await fetch(`${API}/api/latest/`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setSensor({
          o2_pct: data.o2_pct,
          o2_mgl: data.o2_mgl,
          temp:   data.temp,
        })
      } catch (err) {
        console.error('Sensor API Error:', err)
      }
    }

    fetchSensor()
    const interval = setInterval(fetchSensor, 3000)
    return () => clearInterval(interval)
  }, [])

  // ==================== POLL CALIBRATE STATUS ====================

  useEffect(() => {
    if (!isPolling) return

    const startTime = Date.now()

    const interval = setInterval(async () => {

      // Frontend timeout 5 นาที
      if (Date.now() - startTime > 300000) {
        clearInterval(interval)
        setIsPolling(false)
        setCalState(prev => ({
          ...prev,
          phase:  'done',
          status: 'TIMEOUT',
        }))
        return
      }

      try {
        const res  = await fetch(`${API}/api/calibrate/status/`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        if (data.cal_status) {
          // ── จุดที่ 3 — แยก OK / FAIL ──────────────────────────────
          if (data.cal_status === 'OK') {
            clearInterval(interval)
            setIsPolling(false)
            setCalState(prev => ({
              ...prev,
              phase:      'done',
              status:     'OK',
              reason:     '',
              finalValue: data.cal_value ?? 0,
              progress:   0,
              total:      0,
              value:      data.cal_value ?? 0,
            }))
            setShowSuccess(true) // ← เปิด success popup
          } else {
            // FAIL หรือ status อื่น ๆ
            clearInterval(interval)
            setIsPolling(false)
            setCalState({
              phase:      'done',
              status:     data.cal_status,
              reason:     data.cal_reason  || '',
              finalValue: data.cal_value   ?? 0,
              progress:   0,
              total:      0,
              value:      data.cal_value   ?? 0,
              type:       null,
            })
          }
        } else if (data.cal_phase) {
          // ยังอยู่ระหว่างทำ
          setCalState(prev => ({
            ...prev,
            phase:    data.cal_phase,
            progress: data.cal_progress ?? prev.progress,
            total:    data.cal_total    ?? prev.total,
            value:    data.cal_value    ?? prev.value,
          }))
        }
      } catch (err) {
        console.error('Cal Status Error:', err)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPolling])

  // ==================== HANDLERS ====================

  const handleStart = async () => {
    if (!dialogType || isStarting) return
    const selectedType = dialogType
    setIsStarting(true)

    try {
      const res = await fetch(`${API}/api/calibrate/start/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: selectedType }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setDialogType(null)
      setCalState({ ...INITIAL_CAL_STATE, phase: 'waiting_stable', type: selectedType })
      setIsPolling(true)

    } catch (err) {
      console.error('Calibration Start Error:', err)
      alert('ไม่สามารถส่งคำสั่งได้ กรุณาลองใหม่')
    } finally {
      setIsStarting(false)
    }
  }

  const handleReset = () => {
    setCalState(INITIAL_CAL_STATE)
    setIsPolling(false)
    setDialogType(null)
    setShowSuccess(false)
  }

  // กด ✕ ได้ทุก phase — ถ้ากำลัง calibrate → ยกเลิกด้วย
  const handleDialogChange = (open) => {
    if (!open) {
      if (
        calState.phase === 'waiting_stable' ||
        calState.phase === 'measuring'
      ) {
        handleReset()
      } else {
        setDialogType(null)
      }
    }
  }

  // ==================== COMPUTED ====================

  // ซ่อน Dialog เมื่อเปิด success popup (เพื่อไม่ให้ซ้อนกัน)
  const isDialogOpen = !showSuccess && (!!dialogType || calState.phase !== 'idle')

  const config = dialogType ? CAL_CONFIG[dialogType] : null

  const progressPercent =
    calState.total > 0
      ? Math.min(100, Math.max(0, (calState.progress / calState.total) * 100))
      : 0

  // ==================== RENDER ====================

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-xl font-semibold mb-1">สอบเทียบเซนเซอร์</h1>
        <p className="text-sm text-muted-foreground">ค่า Sensor Realtime</p>
      </div>

      {/* 3 SENSOR CARDS */}
      <div className="flex flex-col sm:flex-row gap-4">
        {CARDS.map((card) => (
          <SensorCard key={card.id} card={card} value={sensor[card.id]} />
        ))}
      </div>

      {/* CALIBRATION SELECTION */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-4">
          เลือกประเภท Calibrate
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChallengeCard
            title="SAT 100%"
            description="แขวน sensor ในอากาศ ห่างจากพื้น 50 ซม. รอค่านิ่งก่อนเริ่ม"
            buttonText="เลือก SAT"
            backgroundColor="bg-gradient-to-br from-blue-500 to-blue-700"
            onClick={() => calState.phase === 'idle' && setDialogType('SAT')}
            disabled={calState.phase !== 'idle'}
          />
          <ChallengeCard
            title="ZERO 0%"
            description="จุ่ม sensor ในน้ำยา Na₂SO₃ รอค่านิ่งก่อนเริ่ม"
            buttonText="เลือก ZERO"
            backgroundColor="bg-gradient-to-br from-emerald-500 to-emerald-700"
            onClick={() => calState.phase === 'idle' && setDialogType('ZERO')}
            disabled={calState.phase !== 'idle'}
          />
        </div>
      </div>

      {/* ==================== DIALOG ==================== */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="
          w-[calc(100vw-2rem)]
          max-w-sm
          max-h-[85vh]
          overflow-y-auto
          rounded-2xl
          text-center
          p-5
          sm:p-8
        ">

          {/* ── CONFIRMATION ── */}
          {config && calState.phase === 'idle' && (
            <>
              <div className="text-6xl mb-4">{config.icon}</div>

              <DialogTitle className="text-xl font-bold mb-2">
                {config.title}
              </DialogTitle>

              <p className="text-sm text-muted-foreground mb-6">
                กรุณาทำตามขั้นตอนก่อนเริ่ม
              </p>

              <ol className="text-left space-y-3 mb-8">
                {config.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    <span className="min-w-0">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="flex gap-3">
                <button
                  onClick={() => setDialogType(null)}
                  disabled={isStarting}
                  className="flex-1 min-w-0 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="flex-1 min-w-0 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isStarting ? 'กำลังส่งคำสั่ง...' : 'เริ่ม Calibrate →'}
                </button>
              </div>
            </>
          )}

          {/* ── WAITING STABLE ── */}
          {calState.phase === 'waiting_stable' && (
            <>
              <div className="text-5xl mb-4">⏳</div>

              <DialogTitle className="text-xl font-bold mb-2">
                กำลังรอค่านิ่ง
              </DialogTitle>

              <p className="font-semibold text-blue-600 mb-4">
                รอค่านิ่ง ({calState.progress}/{calState.total || 3})
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                ค่าปัจจุบัน: {Number(calState.value).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                กรุณารอจนกว่าเซนเซอร์จะมีค่าคงที่
              </p>

              <button
                onClick={handleReset}
                className="w-full mt-5 py-2.5 rounded-xl border text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                ยกเลิก
              </button>
            </>
          )}

          {/* ── MEASURING ── */}
          {calState.phase === 'measuring' && (
            <>
              <div className="text-5xl mb-4">📊</div>

              <DialogTitle className="text-xl font-bold mb-2">
                กำลังวัดค่า
              </DialogTitle>

              <p className="font-semibold text-blue-600 mb-4">
                กำลังวัด ({calState.progress}/{calState.total || 9})
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                ค่าปัจจุบัน: {Number(calState.value).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                เวลาที่เหลือประมาณ{' '}
                {Math.max(0, (calState.total - calState.progress) * 3)}{' '}
                วินาที
              </p>

              <button
                onClick={handleReset}
                className="w-full mt-5 py-2.5 rounded-xl border text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                ยกเลิก
              </button>
            </>
          )}

          {/* ── DONE FAIL ── */}
          {calState.phase === 'done' && calState.status === 'FAIL' && (
            <>
              <div className="text-6xl mb-4">❌</div>

              <DialogTitle className="text-xl font-bold text-red-600 mb-3">
                Calibrate ล้มเหลว
              </DialogTitle>

              <div className="bg-red-50 rounded-xl p-4 text-left space-y-2 mb-4">
                <p className="text-sm font-medium">สาเหตุ:</p>
                <p className="text-sm text-muted-foreground break-words">
                  {calState.reason || 'ไม่ทราบสาเหตุ'}
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 text-left mb-5">
                <p className="text-sm font-medium text-amber-700">คำแนะนำ</p>
                <p className="text-sm text-amber-700 mt-1">
                  {getAdvice(calState.reason)}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                ลองใหม่
              </button>
            </>
          )}

          {/* ── TIMEOUT ── */}
          {calState.phase === 'done' && calState.status === 'TIMEOUT' && (
            <>
              <div className="text-6xl mb-4">⚠️</div>

              <DialogTitle className="text-xl font-bold text-yellow-600 mb-3">
                หมดเวลารอ
              </DialogTitle>

              <p className="text-sm text-muted-foreground mb-5">
                อุปกรณ์ไม่ตอบสนอง ตรวจสอบการเชื่อมต่อ LoRa และ MQTT
              </p>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                ลองใหม่
              </button>
            </>
          )}

        </DialogContent>
      </Dialog>

      {/* ── จุดที่ 4 — SUCCESS POPUP ── */}
      <CalibrateSuccess
        isOpen={showSuccess}
        onClose={() => { setShowSuccess(false); handleReset() }}
        calType={calState.type}
        calValue={calState.finalValue}
        o2Pct={sensor.o2_pct ?? 0}
        o2Mgl={sensor.o2_mgl ?? 0}
        temp={sensor.temp ?? 0}
        timestamp={new Date().toLocaleString('th-TH')}
      />

    </div>
  )
}
