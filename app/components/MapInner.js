
'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Menu } from 'lucide-react'
import MapSidebar from './MapSidebar'

function getColor(o2) {
  if (o2 >= 80) return '#22c55e'
  if (o2 >= 50) return '#eab308'
  return '#ef4444'
}

const TILE_STREET = () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxNativeZoom: 19,
  maxZoom: 19,
})

const TILE_SATELLITE = () => L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: '© Esri',
    maxNativeZoom: 18,
    maxZoom: 20,
  }
)

export default function MapInner({ currentPoint, trackHistory }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const polylineRef = useRef(null)
  const historyMarkersRef = useRef([])
  const heatLayerRef = useRef(null)
  const tileLayerRef = useRef(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeLayer, setActiveLayer] = useState('street')
  const [showMarkers, setShowMarkers] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)

  // สถานะสำหรับค้นหาสถานที่
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  // ค้นหาสถานที่ด้วย OpenStreetMap Nominatim
  async function handleSearch(e) {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setSearching(true)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      )

      if (!res.ok) {
        throw new Error('ไม่สามารถค้นหาสถานที่ได้')
      }

      const results = await res.json()

      if (results.length > 0 && mapInstanceRef.current) {
        const { lat, lon } = results[0]

        mapInstanceRef.current.setView(
          [parseFloat(lat), parseFloat(lon)],
          16
        )
      } else {
        console.log('ไม่พบสถานที่ที่ค้นหา')
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  // 1. Init map
  useEffect(() => {
    if (mapInstanceRef.current) return

    mapInstanceRef.current = L.map(mapRef.current, {
      maxZoom: 20
    }).setView([13.7563, 100.5018], 15)

    tileLayerRef.current = TILE_STREET()
    tileLayerRef.current.addTo(mapInstanceRef.current)
  }, [])

  // 2. สลับ Tile + ปรับ maxZoom ตาม provider + clamp zoom ถ้าเกิน
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)

    if (activeLayer === 'street') {
      tileLayerRef.current = TILE_STREET()
      mapInstanceRef.current.setMaxZoom(19)

      if (mapInstanceRef.current.getZoom() > 19) {
        mapInstanceRef.current.setZoom(19)
      }
    } else {
      tileLayerRef.current = TILE_SATELLITE()
      mapInstanceRef.current.setMaxZoom(20)
    }

    tileLayerRef.current.addTo(mapInstanceRef.current)
  }, [activeLayer])

  // 3. วาด/เคลียร์ Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    historyMarkersRef.current.forEach(m => m.remove())
    historyMarkersRef.current = []

    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    // 🔥 Heatmap
    if (showHeatmap) {
      import('leaflet.heat').then(() => {
        const allPoints = [...(trackHistory ?? [])]

        if (currentPoint) allPoints.push(currentPoint)

        if (allPoints.length > 0) {
          const heatData = allPoints.map(p => [
            p.lat,
            p.lng,
            1 - (Math.min(Math.max(p.o2, 0), 100) / 100)
          ])

          heatLayerRef.current = L.heatLayer(heatData, {
            radius: 40,
            blur: 30,
            maxZoom: 17,
            max: 1,
            gradient: {
              0.0: '#22c55e',
              0.4: '#86efac',
              0.6: '#eab308',
              0.8: '#f97316',
              1.0: '#ef4444',
            },
          }).addTo(mapInstanceRef.current)
        }
      })
    }

    // 📍 Markers + Polyline
    if (showMarkers && trackHistory?.length) {
      const latlngs = trackHistory.map(p => [p.lat, p.lng])

      polylineRef.current = L.polyline(latlngs, {
        color: '#38bdf8',
        weight: 3,
        opacity: 0.8,
        dashArray: '6 4',
      }).addTo(mapInstanceRef.current)

      trackHistory.forEach(p => {
        const m = L.circleMarker([p.lat, p.lng], {
          radius: 6,
          fillColor: getColor(p.o2),
          color: '#fff',
          weight: 1.5,
          fillOpacity: 0.85,
        })
          .bindPopup(`O₂: ${p.o2}% | ${p.mgl} mg/L`)
          .addTo(mapInstanceRef.current)

        historyMarkersRef.current.push(m)
      })
    }

    // 🟢 จุดปัจจุบัน
    if (currentPoint) {
      const { lat, lng, o2, mgl } = currentPoint

      markerRef.current = L.circleMarker([lat, lng], {
        radius: showMarkers ? 13 : 9,
        fillOpacity: 0.95,
        fillColor: getColor(o2),
        color: '#fff',
        weight: 2.5,
      })
        .bindPopup(`<b>ตำแหน่งปัจจุบัน</b><br/>O₂: <b>${o2}%</b> | <b>${mgl} mg/L</b>`)
        .addTo(mapInstanceRef.current)

      mapInstanceRef.current.panTo([lat, lng])
    }

  }, [showMarkers, showHeatmap, currentPoint, trackHistory])

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden">

      {/* ปุ่มเมนูแผนที่ */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 right-3 bg-white hover:bg-slate-50 text-slate-700 shadow-md border border-slate-200/80 p-2.5 rounded-xl flex items-center justify-center transition-all hover:scale-105"
        style={{ zIndex: 1000 }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ช่องค้นหาสถานที่ */}
      <form
        onSubmit={handleSearch}
        className="absolute top-3 left-3 flex gap-1"
        style={{ zIndex: 1000 }}
      >
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ค้นหาสถานที่..."
          className="px-3 py-2 rounded-xl text-sm border border-slate-200 shadow-md bg-white/95 backdrop-blur-sm w-48 outline-none focus:border-sky-300"
        />

        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="bg-white hover:bg-slate-50 px-3 py-2 rounded-xl shadow-md border border-slate-200 text-sm font-bold disabled:opacity-50"
        >
          {searching ? '...' : '🔍'}
        </button>
      </form>

      <MapSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        showMarkers={showMarkers}
        setShowMarkers={setShowMarkers}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
      />

      {showHeatmap && (
        <div
          className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg text-xs font-bold flex flex-col gap-1.5 border border-slate-100"
          style={{ zIndex: 1000 }}
        >
          <span className="text-slate-500 mb-0.5 block border-b pb-1">
            ระดับออกซิเจน (O₂)
          </span>

          <span className="flex items-center gap-2">
            <span className="w-4 h-3 rounded shadow-inner" style={{ background: '#22c55e' }}></span>
            สูง ≥ 80%
          </span>

          <span className="flex items-center gap-2">
            <span className="w-4 h-3 rounded shadow-inner" style={{ background: '#eab308' }}></span>
            กลาง ≥ 50%
          </span>

          <span className="flex items-center gap-2">
            <span className="w-4 h-3 rounded shadow-inner" style={{ background: '#ef4444' }}></span>
            ต่ำ &lt; 50%
          </span>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />
    </div>
  )
}
