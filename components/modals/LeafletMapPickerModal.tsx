"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { FiSearch, FiLoader } from "react-icons/fi";

// 1. MUST export this interface for OfficeLocationModal to import it
export interface LeafletMapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792]; // Lagos

// Fix Leaflet default marker icon issue in React
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (isValidCoordinate(lat, lng)) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return null;
}

const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    !(lat === 0 && lng === 0)
  );
};

export default function LeafletMapPicker({
  lat,
  lng,
  radius,
  onChange,
}: LeafletMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const hasValidPosition = isValidCoordinate(lat, lng);
  const position: [number, number] = hasValidPosition
    ? [lat, lng]
    : DEFAULT_CENTER;

  // Search address or landmark via OpenStreetMap Nominatim
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const searchedLat = parseFloat(data[0].lat);
        const searchedLng = parseFloat(data[0].lon);

        onChange(searchedLat, searchedLng);
      } else {
        setSearchError("Location not found. Try a more specific name.");
      }
    } catch (err) {
      setSearchError("Failed to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchError) setSearchError("");
            }}
            placeholder="Search address or landmark (e.g. Ikeja City Mall)..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isSearching ? (
            <>
              <FiLoader className="animate-spin" size={16} />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <FiSearch size={16} />
              <span>Search</span>
            </>
          )}
        </button>
      </form>

      {/* Error Feedback */}
      {searchError && (
        <p className="text-xs text-red-500 font-medium">{searchError}</p>
      )}

      {/* Map Display */}
      <div className="h-[250px] w-full rounded-md overflow-hidden border border-gray-200">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasValidPosition && (
            <>
              <Marker
                position={position}
                icon={customIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const newPos = marker.getLatLng();
                    onChange(newPos.lat, newPos.lng);
                  },
                }}
              />
              <Circle
                center={position}
                radius={radius}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.2,
                }}
              />
            </>
          )}

          <MapClickHandler onChange={onChange} />
          <RecenterOnChange lat={lat} lng={lng} />
        </MapContainer>
      </div>
    </div>
  );
}
