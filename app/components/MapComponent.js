'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// ป้องกัน SSR error ของ leaflet
const MapComponent = dynamic(() => import('./MapInner'), { ssr: false })

export default MapComponent