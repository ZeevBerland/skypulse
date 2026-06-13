"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color: "blue" | "red" | "green" | "purple" | "gray" | "orange";
  popup?: string;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  radiusMeters?: number;
  className?: string;
}

const MARKER_COLORS: Record<string, string> = {
  blue: "#3d71d9",
  red: "#d10e5c",
  green: "#1a7f4b",
  purple: "#8f3bb8",
  gray: "#666",
  orange: "#ff9900",
};

function createIcon(color: string, isPrimary?: boolean) {
  const size = isPrimary ? 14 : 10;
  const border = isPrimary ? 3 : 2;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border}px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

export function LeafletMap({
  center,
  zoom = 15,
  markers = [],
  radiusMeters = 1000,
  className = "h-[500px] rounded-lg",
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    L.circle(center, {
      radius: radiusMeters,
      color: "#5794f2",
      fillColor: "#5794f2",
      fillOpacity: 0.06,
      weight: 1,
      dashArray: "5 5",
    }).addTo(map);

    markers.forEach((m, i) => {
      const isPrimary = i === 0;
      const icon = createIcon(MARKER_COLORS[m.color] || MARKER_COLORS.blue, isPrimary);
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.popup) {
        marker.bindPopup(
          `<div style="background:#181b1f;color:#ccccdc;padding:8px 12px;border-radius:6px;font-size:12px;min-width:140px;">
            <strong>${m.label}</strong>
            <div style="margin-top:4px;color:#a0a0b0;">${m.popup}</div>
          </div>`,
          {
            className: "dark-popup",
            closeButton: false,
          },
        );
      } else {
        marker.bindTooltip(m.label, { direction: "top", offset: [0, -8] });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom, markers, radiusMeters]);

  return <div ref={mapRef} className={className} />;
}
