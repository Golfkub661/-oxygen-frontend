'use client'

import React from 'react'
import { Map, Layers, Route, Flame, X } from 'lucide-react'

export default function MapSidebar({ 
  isOpen, 
  setIsOpen, 
  activeLayer, 
  setActiveLayer, 
  showMarkers,     
  setShowMarkers, 
  showHeatmap,     
  setShowHeatmap 
}) {
  
  return (
    <div 
      className={`absolute top-0 right-0 h-full w-72 bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out rounded-r-xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ zIndex: 1001 }}
    >
      
      {/* ส่วนหัวแผงควบคุม */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-base text-slate-800">เครื่องมือควบคุมแผนที่</h3>
          <p className="text-xs text-slate-500">ปรับแต่งการแสดงผลข้อมูล</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* เนื้อหาเมนู */}
      <div className="p-4 flex flex-col gap-6">
        
        {/* หมวดหมู่ที่ 1: เปลี่ยนชื่อเป็น การแสดงผล (รูปแบบแผนที่) */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            การแสดงผลรูปแบบแผนที่
          </span>
          <div className="flex flex-col gap-1.5">
            
            {/* แผนที่ปกติ (เอาภาพออก / ขยายตัวหนังสือ) */}
            <button
              onClick={() => setActiveLayer('street')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                activeLayer === 'street' 
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm border-emerald-100' 
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Map className={`h-4 w-4 ${activeLayer === 'street' ? 'text-emerald-500' : 'text-slate-400'}`} />
               แผนที่ปกติ
            </button>

            {/* ภาพดาวเทียม (เอาภาพออก / ขยายตัวหนังสือ) */}
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                activeLayer === 'satellite' 
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100' 
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Layers className={`h-4 w-4 ${activeLayer === 'satellite' ? 'text-emerald-500' : 'text-slate-400'}`} />
               ภาพดาวเทียม
            </button>

          </div>
        </div>

        {/* หมวดหมู่ที่ 2: เปลี่ยนชื่อเป็น การแสดงผล (ข้อมูลซ้อนทับ) */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            การแสดงผลข้อมูล 
          </span>
          <div className="flex flex-col gap-1.5">
            
            {/* เส้นทาง (จุดพิกัด) (เอาภาพออก / ขยายตัวหนังสือ) */}
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                showMarkers 
                  ? 'bg-sky-50 text-sky-600 border-sky-100 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Route className={`h-4 w-4 ${showMarkers ? 'text-sky-500' : 'text-slate-400'}`} />
                <span> เส้นทาง (จุดพิกัด)</span>
              </div>
              <input 
                type="checkbox" 
                checked={showMarkers} 
                readOnly 
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 h-4 w-4" 
              />
            </button>

            {/* Heatmap ความร้อน O2 (เอาภาพออก / ขยายตัวหนังสือ) */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                showHeatmap 
                  ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flame className={`h-4 w-4 ${showHeatmap ? 'text-red-500' : 'text-slate-400'}`} />
                <span> Heatmap ความร้อน O₂</span>
              </div>
              <input 
                type="checkbox" 
                checked={showHeatmap} 
                readOnly 
                className="rounded border-slate-300 text-red-500 focus:ring-red-500 h-4 w-4" 
              />
            </button>

          </div>
        </div>

      </div>

      {/* ท้ายแถบเมนู */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-slate-50 border-t border-slate-100 rounded-br-xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          เชื่อมต่อข้อมูลบอร์ดควบคุมเรียบร้อย
        </div>
      </div>

    </div>
  )
}