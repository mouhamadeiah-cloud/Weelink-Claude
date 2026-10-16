// A small OpenStreetMap map with one pin: the owner drags the pin, or taps the map, to mark where
// their place is. Loaded on demand (Leaflet stays out of the main bundle). OpenStreetMap needs no
// key; its tiles must show the attribution in the corner.
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng {
  lat: number;
  lng: number;
}

// A drawn pin, so no marker image files have to be served.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 39C15 39 28 24.5 28 14.5A13 13 0 0 0 2 14.5C2 24.5 15 39 15 39Z" fill="#0071e3" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14.5" r="5" fill="#fff"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 39],
});

const LocationPicker: React.FC<{
  value: LatLng;
  zoom?: number;
  onPick: (p: LatLng) => void;
}> = ({ value, zoom = 16, onPick }) => {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([value.lat, value.lng], zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(m);
    const mk = L.marker([value.lat, value.lng], { draggable: true, icon: pinIcon, autoPan: true }).addTo(m);
    mk.on('dragend', () => {
      const p = mk.getLatLng();
      pick.current({ lat: p.lat, lng: p.lng });
    });
    m.on('click', (e: L.LeafletMouseEvent) => {
      mk.setLatLng(e.latlng);
      pick.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.current = m;
    marker.current = mk;
    // The panel may still be animating open; measure again once it has its size.
    const t = setTimeout(() => m.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new point from outside (the device's location): move the pin and the map to it.
  useEffect(() => {
    const mk = marker.current;
    if (!mk || !map.current) return;
    const cur = mk.getLatLng();
    if (Math.abs(cur.lat - value.lat) < 1e-7 && Math.abs(cur.lng - value.lng) < 1e-7) return;
    mk.setLatLng([value.lat, value.lng]);
    map.current.setView([value.lat, value.lng], Math.max(map.current.getZoom(), zoom));
  }, [value.lat, value.lng, zoom]);

  return <div ref={box} dir="ltr" className="w-full h-52 rounded-lg overflow-hidden border border-neutral-200 z-0 relative" />;
};

export default LocationPicker;
