"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Input from "../Input";
import { SVGLoader } from "../SVGLoader";
import { useUpdateOfficeLocationMutation } from "@/utils/APISlice/officeLocationApi";
import { AiOutlineClose, AiOutlineSearch } from "react-icons/ai";
import { MdMyLocation } from "react-icons/md";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { LeafletMapPickerProps } from "./LeafletMapPickerModal";

const LeafletMapPicker = dynamic<LeafletMapPickerProps>(
  () => import("./LeafletMapPickerModal"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] w-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm animate-pulse rounded-md">
        Loading Map...
      </div>
    ),
  }
);

interface OfficeLocationUpdateModalProps {
  id: string;
  office: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    [key: string]: any;
  };
}

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_CENTER = {
  lat: 6.6382954,
  lng: 3.3285801,
};

const OfficeLocationUpdateModal = ({ id, office }: OfficeLocationUpdateModalProps) => {
  const [
    updateOfficeLocation,
    { isLoading: isLoadingUpdate, isSuccess: successUpdate },
  ] = useUpdateOfficeLocationMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [inputs, setInputs] = useState<{
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    radius: number;
  }>({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: 100,
  });

  // Address search state — separate from the "address" form field itself,
  // since the person may search for one place but still want to type a
  // custom label/address afterward.
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  const numLat = parseFloat(inputs.latitude);
  const numLng = parseFloat(inputs.longitude);

  const hasPinpointedLocation =
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    (numLat !== 0 || numLng !== 0);

  useEffect(() => {
    if (isOpen && office) {
      setInputs({
        name: office.name || "",
        address: office.address || "",
        latitude: office.latitude !== undefined ? String(office.latitude) : "",
        longitude: office.longitude !== undefined ? String(office.longitude) : "",
        radius: office.radius ?? 100,
      });
      setLocationQuery("");
      setSearchResults([]);
      setShowResults(false);
    }
  }, [isOpen, office]);

  useEffect(() => {
    if (successUpdate) {
      setIsOpen(false);
      resetForm();
    }
  }, [successUpdate]);

  // Debounced address search against OpenStreetMap's Nominatim geocoder.
  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(
            locationQuery
          )}`,
          { signal: controller.signal }
        );
        const data: GeocodeResult[] = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleOnChange = (input: string, value: any) => {
    setInputs((prevState) => ({
      ...prevState,
      [input]: value,
    }));
  };

  const handleSelectSearchResult = (result: GeocodeResult) => {
    handleOnChange("latitude", result.lat);
    handleOnChange("longitude", result.lon);
    // Prefill the address field from the match too — the person can
    // still edit it freely afterward, this just saves the retype.
    handleOnChange("address", result.display_name);
    setLocationQuery(result.display_name);
    setShowResults(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device/browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleOnChange("latitude", String(position.coords.latitude));
        handleOnChange("longitude", String(position.coords.longitude));
        setLocationQuery("");
        setSearchResults([]);
        setShowResults(false);
        setIsLocating(false);
        toast.success("Pin set to your current location.");
      },
      () => {
        setIsLocating(false);
        toast.error("Could not get your current location. Check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetForm = () => {
    if (office) {
      setInputs({
        name: office.name || "",
        address: office.address || "",
        latitude: office.latitude !== undefined ? String(office.latitude) : "",
        longitude: office.longitude !== undefined ? String(office.longitude) : "",
        radius: office.radius ?? 100,
      });
    }
    setLocationQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (!inputs.name || !inputs.address) {
      toast.error("Please fill in the office name and address.");
      return;
    }

    if (!hasPinpointedLocation) {
      toast.error("Please search, pinpoint, or enter a valid office location before saving.");
      return;
    }

    if (numLat < -90 || numLat > 90) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }

    if (numLng < -180 || numLng > 180) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }

    try {
      await updateOfficeLocation({
        id,
        body: {
          name: inputs.name,
          address: inputs.address,
          latitude: numLat,
          longitude: numLng,
          radius: Number(inputs.radius),
        },
      }).unwrap();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to update office location"));
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <div className="z-50">
      <button
        className="flex flex-row justify-center items-center px-5 py-[8px] gap-2 !bg-[#2563EB] font-normal text-[14px] leading-[150%] text-[#FFFFFF] rounded-none"
        onClick={() => setIsOpen(true)}
      >
        Update
      </button>

      {isOpen && (
        <>
          <div
            className="fixed !inset-0 bg-[#00000051] !bg-opacity-50 z-40"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
          ></div>

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white w-[700px] max-w-[95vw] max-h-[90vh] rounded-[5px] flex flex-col shadow-xl relative">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white rounded-t-[32px]">
                <h3 className="text-lg font-semibold">Update Office</h3>
                <button
                  className="text-gray-500 hover:text-gray-800 rounded-none"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto min-h-7 flex flex-col gap-5">
                <Input
                  type="text"
                  value={inputs.name}
                  handleOnChange={(e) => handleOnChange("name", e.target.value)}
                  label="Office Name"
                  placeholder="Office Name"
                />
                <Input
                  type="text"
                  value={inputs.address}
                  handleOnChange={(e) => handleOnChange("address", e.target.value)}
                  label="Address"
                  placeholder="Address"
                />

                {/* Location Section */}
                <div className="flex flex-col gap-2 border border-gray-200 rounded-md p-4 bg-gray-50/50">
                  <label className="text-sm font-semibold text-gray-800">
                    Office Location
                  </label>
                  <p className="text-xs text-gray-500 -mt-1">
                    Search for the office, use your current location, or fine-tune by
                    dragging the pin / typing coordinates.
                  </p>

                  {/* Search bar */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <AiOutlineSearch
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          value={locationQuery}
                          onChange={(e) => setLocationQuery(e.target.value)}
                          onFocus={() => searchResults.length > 0 && setShowResults(true)}
                          placeholder="Search for a place or address..."
                          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <SVGLoader width="16px" height="16px" color="#2563EB" />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                        title="Use my current location"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                      >
                        {isLocating ? (
                          <SVGLoader width="14px" height="14px" color="#374151" />
                        ) : (
                          <MdMyLocation size={14} />
                        )}
                        My Location
                      </button>
                    </div>

                    {/* Results dropdown */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSearchResult(result)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            {result.display_name}
                          </button>
                        ))}
                      </div>
                    )}

                    {showResults && !isSearching && locationQuery.trim().length >= 3 && searchResults.length === 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-400">
                        No matches found — try a broader search or use the map/coordinates below.
                      </div>
                    )}
                  </div>

                  {/* Map */}
                  <div className="mt-1">
                    {!hasPinpointedLocation && (
                      <span className="text-amber-600 text-xs font-medium block mb-1">
                        Location not set yet — search above, use your location, or drop
                        a pin on the map.
                      </span>
                    )}
                    <LeafletMapPicker
                      lat={hasPinpointedLocation ? numLat : DEFAULT_CENTER.lat}
                      lng={hasPinpointedLocation ? numLng : DEFAULT_CENTER.lng}
                      radius={inputs.radius}
                      onChange={(lat, lng) => {
                        handleOnChange("latitude", String(lat));
                        handleOnChange("longitude", String(lng));
                        setLocationQuery("");
                        setSearchResults([]);
                        setShowResults(false);
                      }}
                    />
                  </div>

                  {/* Editable Coordinates — fine-tune fallback */}
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <Input
                      type="number"
                      value={inputs.latitude}
                      handleOnChange={(e) => handleOnChange("latitude", e.target.value)}
                      label="Latitude"
                      placeholder="e.g. 6.638295"
                    />
                    <Input
                      type="number"
                      value={inputs.longitude}
                      handleOnChange={(e) => handleOnChange("longitude", e.target.value)}
                      label="Longitude"
                      placeholder="e.g. 3.328580"
                    />
                  </div>
                </div>

                {/* Geofence Radius Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                    <span>Geofence Radius</span>
                    <span className="text-blue-600 font-semibold">
                      {inputs.radius} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={inputs.radius}
                    onChange={(e) =>
                      handleOnChange("radius", Number(e.target.value))
                    }
                    aria-label="Geofence radius in meters"
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end bg-white rounded-b-[32px]">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="btn_model_outline rounded-none"
                >
                  Cancel
                </button>
                <button
                  className="btn_model_active ml-3 rounded-none"
                  onClick={handleSubmit}
                  disabled={isLoadingUpdate}
                >
                  {isLoadingUpdate ? (
                    <SVGLoader width="30px" height="30px" color="#FFF" />
                  ) : (
                    "Update Office"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OfficeLocationUpdateModal;