'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function getColor(o2) {
  if (o2 >= 80) return '#22c55e'
  if (o2 >= 50) return '#eab308'
  return '#ef4444'
}

const TILE_STREET = () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors', maxZoom: 19,
})
const TILE_SATELLITE = () => L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { attribution: '© Esri', maxZoom: 19 }
)

export default function MapInner({ currentPoint, trackHistory }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const polylineRef = useRef(null)
  const historyMarkersRef = useRef([])
  const heatLayerRef = useRef(null)
  const tileLayerRef = useRef(null)
  const [activeLayer, setActiveLayer] = useState('street')
  const [showMode, setShowMode] = useState('marker') // 'marker' | 'heat'

  // สร้างแผนที่
  useEffect(() => {
    if (mapInstanceRef.current) return
    mapInstanceRef.current = L.map(mapRef.current).setView([13.7563, 100.5018], 15)
    tileLayerRef.current = TILE_STREET()
    tileLayerRef.current.addTo(mapInstanceRef.current)
  }, [])

  // สลับ tile layer
  const switchLayer = (type) => {
    if (!mapInstanceRef.current || activeLayer === type) return
    mapInstanceRef.current.removeLayer(tileLayerRef.current)
    tileLayerRef.current = type === 'street' ? TILE_STREET() : TILE_SATELLITE()
    tileLayerRef.current.addTo(mapInstanceRef.current)
    setActiveLayer(type)
  }

  // วาด Marker / Heatmap ตาม mode
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // เคลียร์ทุก layer
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null }
    historyMarkersRef.current.forEach(m => m.remove())
    historyMarkersRef.current = []
    if (heatLayerRef.current) { mapInstanceRef.current.removeLayer(heatLayerRef.current); heatLayerRef.current = null }

    if (showMode === 'marker') {
      // ── โหมด Marker + Polyline ──
      if (trackHistory?.length) {
        const latlngs = trackHistory.map(p => [p.lat, p.lng])
        polylineRef.current = L.polyline(latlngs, {
          color: '#38bdf8', weight: 3, opacity: 0.7, dashArray: '6 4',
        }).addTo(mapInstanceRef.current)

        trackHistory.forEach(p => {
          const m = L.circleMarker([p.lat, p.lng], {
            radius: 6, fillColor: getColor(p.o2),
            color: '#fff', weight: 1.5, fillOpacity: 0.85,
          })
            .bindPopup(`O₂: ${p.o2}% | ${p.mgl} mg/L`)
            .addTo(mapInstanceRef.current)
          historyMarkersRef.current.push(m)
        })
      }

      if (currentPoint) {
        const { lat, lng, o2, mgl } = currentPoint
        markerRef.current = L.circleMarker([lat, lng], {
          radius: 13, fillColor: getColor(o2),
          color: '#fff', weight: 2.5, fillOpacity: 0.95,
        })
          .bindPopup(`<b>ตำแหน่งปัจจุบัน</b><br/>O₂: <b>${o2}%</b> | <b>${mgl} mg/L</b>`)
          .addTo(mapInstanceRef.current)
        mapInstanceRef.current.panTo([lat, lng])
      }

    } else {
      // ── โหมด Heatmap ──
      import('leaflet.heat').then(() => {
        const allPoints = [...(trackHistory ?? [])]
        if (currentPoint) allPoints.push(currentPoint)
        if (!allPoints.length) return

        // แปลง o2% → intensity (0–1)
        // o2 สูง = เขียว → intensity ต่ำ (เย็น)
        // o2 ต่ำ = แดง → intensity สูง (ร้อน)
        const heatData = allPoints.map(p => [
          p.lat,
          p.lng,
          1 - (Math.min(Math.max(p.o2, 0), 100) / 100) // invert: O2 ต่ำ = ร้อน
        ])

        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 40,
          blur: 30,
          maxZoom: 17,
          max: 1,
          gradient: {
            0.0: '#22c55e', // เขียว — O2 สูง
            0.4: '#86efac',
            0.6: '#eab308', // เหลือง — O2 กลาง
            0.8: '#f97316', // ส้ม
            1.0: '#ef4444', // แดง — O2 ต่ำ
          },
        }).addTo(mapInstanceRef.current)

        // แสดงจุดปัจจุบันซ้อนบน heatmap
        if (currentPoint) {
          const { lat, lng, o2, mgl } = currentPoint
          markerRef.current = L.circleMarker([lat, lng], {
            radius: 10, fillColor: getColor(o2),
            color: '#fff', weight: 2.5, fillOpacity: 0.95,
          })
            .bindPopup(`<b>ตำแหน่งปัจจุบัน</b><br/>O₂: <b>${o2}%</b> | <b>${mgl} mg/L</b>`)
            .addTo(mapInstanceRef.current)
        }
      })
    }
  }, [showMode, currentPoint, trackHistory])

  return (
    <div className="relative w-full" style={{ height: '420px' }}>

      {/* ปุ่มควบคุม */}
      <div className="absolute top-3 right-3 z-[999] flex flex-col gap-2">

        {/* สลับ tile */}
        <div className="flex rounded-xl overflow-hidden shadow-md border border-gray-200">
          <button onClick={() => switchLayer('street')}
            className={`px-3 py-1.5 text-xs font-bold transition-all ${activeLayer === 'street' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            🗺️ แผนที่
          </button>
          <button onClick={() => switchLayer('satellite')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-gray-200 ${activeLayer === 'satellite' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            🛰️ ดาวเทียม
          </button>
        </div>

        {/* สลับ mode */}
        <div className="flex rounded-xl overflow-hidden shadow-md border border-gray-200">
          <button onClick={() => setShowMode('marker')}
            className={`px-3 py-1.5 text-xs font-bold transition-all ${showMode === 'marker' ? 'bg-sky-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            📍 จุด
          </button>
          <button onClick={() => setShowMode('heat')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-gray-200 ${showMode === 'heat' ? 'bg-sky-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            🌡️ Heatmap
          </button>
        </div>

      </div>

      {/* Legend Heatmap */}
      {showMode === 'heat' && (
        <div className="absolute bottom-8 left-3 z-[999] bg-white/90 rounded-xl px-3 py-2 shadow-md text-xs font-bold flex flex-col gap-1">
          <span className="text-gray-600 mb-1">ระดับ O₂</span>
          <span className="flex items-center gap-2"><span className="w-4 h-3 rounded" style={{background:'#22c55e'}}></span>สูง ≥80%</span>
          <span className="flex items-center gap-2"><span className="w-4 h-3 rounded" style={{background:'#eab308'}}></span>กลาง ≥50%</span>
          <span className="flex items-center gap-2"><span className="w-4 h-3 rounded" style={{background:'#ef4444'}}></span>ต่ำ &lt;50%</span>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-xl" />
    </div>
  )
}