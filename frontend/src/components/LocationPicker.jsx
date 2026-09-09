import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode, searchAddress } from '../services/geocodingService';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [34.0209, -6.8416];

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const LocationPicker = ({
  address,
  onAddressChange,
  latitude,
  longitude,
  onCoordsChange,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const skipSearchRef = useRef(false);

  const position =
    latitude != null && longitude != null
      ? [latitude, longitude]
      : DEFAULT_CENTER;

  const updateLocation = useCallback(
    async (lat, lng, skipReverse = false) => {
      onCoordsChange(lat, lng);
      if (skipReverse) return;
      try {
        const label = await reverseGeocode(lat, lng);
        if (label) {
          skipSearchRef.current = true;
          onAddressChange(label);
        }
      } catch {
        // Coordonnées conservées même si le géocodage inverse échoue
      }
    },
    [onCoordsChange, onAddressChange]
  );

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!address || address.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAddress(address);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address]);

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    skipSearchRef.current = true;
    onAddressChange(item.display_name);
    onCoordsChange(lat, lng);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      () => alert('Impossible d\'accéder à votre position. Vérifiez les permissions.')
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rechercher une adresse
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            onAddressChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Ex: Agdal, Rabat"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        {searching && (
          <span className="absolute right-3 top-[38px] text-gray-400 text-xs">
            <i className="fas fa-spinner fa-spin"></i>
          </span>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-[1000] w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={item.place_id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {item.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 z-0">
        <MapContainer
          center={position}
          zoom={latitude != null ? 16 : 12}
          className="h-[220px] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateSize />
          <MapClickHandler onSelect={updateLocation} />
          {latitude != null && longitude != null && (
            <>
              <Marker
                position={[latitude, longitude]}
                icon={defaultIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    updateLocation(lat, lng);
                  },
                }}
              />
              <MapFlyTo center={[latitude, longitude]} zoom={16} />
            </>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="flex items-center gap-2 text-sm text-wasilatti-orange hover:text-orange-600 font-medium transition-colors"
        >
          <i className="fas fa-location-crosshairs"></i>
          Ma position actuelle
        </button>
        {latitude != null && longitude != null && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Carte gratuite OpenStreetMap — cliquez sur la carte ou déplacez le marqueur.
      </p>
    </div>
  );
};

export default LocationPicker;
