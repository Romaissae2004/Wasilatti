import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const depotIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function FitPoints({ points, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(
        points.map((p) => [p.latitude, p.longitude]),
        { padding: [24, 24], maxZoom: zoom, animate: true }
      );
    } else if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], zoom, { animate: true });
    }
  }, [map, points, zoom]);
  return null;
}

function normalizePoints({ latitude, longitude, address, markers }) {
  if (markers?.length) {
    return markers
      .filter((m) => m.latitude != null && m.longitude != null)
      .map((m) => ({
        latitude: Number(m.latitude),
        longitude: Number(m.longitude),
        label: m.label || m.address || 'Dépôt',
      }));
  }
  if (latitude == null || longitude == null) return [];
  return [{
    latitude: Number(latitude),
    longitude: Number(longitude),
    label: address || 'Dépôt de stockage',
  }];
}

export function DepotLocationMap({
  latitude,
  longitude,
  address,
  markers,
  height = 160,
  zoom = 15,
  interactive = true,
  className = '',
}) {
  const points = useMemo(
    () => normalizePoints({ latitude, longitude, address, markers }),
    [latitude, longitude, address, markers]
  );

  if (!points.length) return null;

  const center = [points[0].latitude, points[0].longitude];

  return (
    <div
      className={className}
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #c5d9f0',
        height,
        position: 'relative',
        zIndex: 0,
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSize />
        <FitPoints points={points} zoom={zoom} />
        {points.map((point, index) => (
          <Marker
            key={`${point.latitude}-${point.longitude}-${index}`}
            position={[point.latitude, point.longitude]}
            icon={depotIcon}
          >
            {interactive && (
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: '#3a6fa8' }}>🏭 Dépôt</strong>
                  <br />
                  {point.label}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export function DepotLocationSection({
  address,
  latitude,
  longitude,
  markers,
  mapHeight = 160,
  title = 'Dépôt de stockage',
  subtitle,
}) {
  const points = normalizePoints({ latitude, longitude, address, markers });
  const hasCoords = points.length > 0;

  if (!address && !hasCoords) return null;

  const primary = points[0];

  return (
    <div
      style={{
        background: '#f0f7ff',
        borderRadius: 10,
        padding: '10px 14px',
        border: '1px solid #c5d9f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3a6fa8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        <span style={{ fontSize: 14 }}>🏭</span>
        {title}
        {subtitle && (
          <span style={{ fontSize: 10, color: '#6b8fc4', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
            {subtitle}
          </span>
        )}
      </div>
      {address && (
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{address}</p>
      )}
      {hasCoords && (
        <>
          <DepotLocationMap
            latitude={primary?.latitude}
            longitude={primary?.longitude}
            address={primary?.label}
            markers={points.length > 1 ? points.map((p) => ({ latitude: p.latitude, longitude: p.longitude, label: p.label })) : undefined}
            height={mapHeight}
            zoom={points.length > 1 ? 13 : 15}
          />
          <span style={{ fontSize: 10, color: '#6b8fc4' }}>
            GPS : {primary.latitude.toFixed(5)}, {primary.longitude.toFixed(5)}
            {points.length > 1 ? ` · ${points.length} dépôts` : ''}
          </span>
        </>
      )}
    </div>
  );
}

export default DepotLocationMap;
