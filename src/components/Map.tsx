'use client'

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

function MapEvents({ setPosition, readonly }: { setPosition?: (pos: [number, number]) => void, readonly: boolean }) {
  const map = useMapEvents({
    click(e) {
      if (!readonly && setPosition) {
        setPosition([e.latlng.lat, e.latlng.lng])
        map.flyTo(e.latlng, map.getZoom())
      }
    },
  })
  return null
}

function MapUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom())
    }
  }, [position, map])
  return null
}

export default function Map({ position, setPosition, readonly = false }: { position: [number, number] | null, setPosition?: (pos: [number, number]) => void, readonly?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const defaultCenter: [number, number] = [19.4326, -99.1332] // CDMX by default

  useEffect(() => {
    // Fix default icon issue with Leaflet in Next.js
    // Only run on client
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-white/10 z-0 relative">
      <MapContainer 
        center={position || defaultCenter} 
        zoom={13} 
        scrollWheelZoom={!readonly} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents setPosition={setPosition} readonly={readonly} />
        <MapUpdater position={position} />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  )
}
