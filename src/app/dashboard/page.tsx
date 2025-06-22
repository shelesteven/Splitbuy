"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthUserContext";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Search } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  imageUrl: string;
  price: string;
};

type LocationFilter = {
  center: { lat: number; lng: number };
  radius: number; // in km
  address: string;
};

const allProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    description: "Top quality noise-cancelling headphones",
    location: "Downtown Toronto",
    coordinates: { lat: 43.6532, lng: -79.3832 },
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
    price: "$299",
  },
  {
    id: "2",
    name: "Gaming Laptop",
    description: "High-performance gaming laptop",
    location: "North York",
    coordinates: { lat: 43.7615, lng: -79.4111 },
    imageUrl:
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=200&fit=crop",
    price: "$1,299",
  },
  {
    id: "3",
    name: "Vintage Camera",
    description: "Classic film camera in excellent condition",
    location: "Scarborough",
    coordinates: { lat: 43.7731, lng: -79.2578 },
    imageUrl:
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop",
    price: "$450",
  },
  {
    id: "4",
    name: "Electric Bike",
    description: "Eco-friendly commuter bike",
    location: "Etobicoke",
    coordinates: { lat: 43.6205, lng: -79.5132 },
    imageUrl:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=200&fit=crop",
    price: "$1,200",
  },
  {
    id: "5",
    name: "Designer Sofa",
    description: "Modern 3-seater sofa",
    location: "Mississauga",
    coordinates: { lat: 43.589, lng: -79.6441 },
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
    price: "$800",
  },
  {
    id: "6",
    name: "Smart Watch",
    description: "Latest fitness tracking smartwatch",
    location: "Markham",
    coordinates: { lat: 43.8561, lng: -79.337 },
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
    price: "$350",
  },
  {
    id: "7",
    name: "Mountain Bike",
    description: "Professional mountain bike",
    location: "Brampton",
    coordinates: { lat: 43.7315, lng: -79.7624 },
    imageUrl:
      "https://images.unsplash.com/photo-1544191696-15693072648c?w=300&h=200&fit=crop",
    price: "$650",
  },
  {
    id: "8",
    name: "Coffee Machine",
    description: "Professional espresso machine",
    location: "Richmond Hill",
    coordinates: { lat: 43.8828, lng: -79.4403 },
    imageUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop",
    price: "$425",
  },
];

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number },
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Mapbox Map Component
const MapboxMap = ({
  center,
  radius,
  onLocationChange,
  onRadiusChange,
  onAddressChange,
  onCurrentLocationRequest,
}: {
  center: { lat: number; lng: number };
  radius: number;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
  onAddressChange: (address: string) => void;
  onCurrentLocationRequest?: () => void;
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // You'll need to add your Mapbox access token here
    // Get it from https://account.mapbox.com/access-tokens/
    const MAPBOX_TOKEN =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN_HERE";

    if (!window.mapboxgl) {
      // Dynamically load Mapbox GL JS
      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
      script.onload = initializeMap;
      document.head.appendChild(script);

      const link = document.createElement("link");
      link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (map.current) return;

      map.current = new window.mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.lng, center.lat],
        zoom: 11,
        accessToken: MAPBOX_TOKEN,
      });

      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl());

      // Add click handler
      map.current.on("click", (e) => {
        const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        onLocationChange(coords);
        reverseGeocode(coords);
      });

      // Add markers and circle when map loads
      map.current.on("load", () => {
        addMarkersAndCircle();
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map center when props change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.setCenter([center.lng, center.lat]);
      addMarkersAndCircle();
    } else if (map.current) {
      map.current.once("load", () => {
        map.current.setCenter([center.lng, center.lat]);
        addMarkersAndCircle();
      });
    }
  }, [center, radius]);

  const addMarkersAndCircle = () => {
    if (!map.current) return;

    // Remove existing sources and layers
    ["radius-circle", "products", "center-marker"].forEach((id) => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
      if (map.current!.getSource(id)) map.current!.removeSource(id);
    });

    // Add radius circle
    const radiusInMeters = radius * 1000;
    const options = { steps: 80, units: "meters" as const };
    const circle = window.turf?.circle(
      [center.lng, center.lat],
      radiusInMeters,
      options,
    );

    if (circle) {
      map.current.addSource("radius-circle", {
        type: "geojson",
        data: circle,
      });

      map.current.addLayer({
        id: "radius-circle",
        type: "fill",
        source: "radius-circle",
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.1,
        },
      });

      map.current.addLayer({
        id: "radius-circle-border",
        type: "line",
        source: "radius-circle",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
    }

    // Add center marker
    map.current.addSource("center-marker", {
      type: "geojson",
      data: {
        type: "Point",
        coordinates: [center.lng, center.lat],
      },
    });

    map.current.addLayer({
      id: "center-marker",
      type: "circle",
      source: "center-marker",
      paint: {
        "circle-radius": 8,
        "circle-color": "#3b82f6",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Add product markers
    const productsData = {
      type: "FeatureCollection" as const,
      features: allProducts.map((product) => ({
        type: "Feature" as const,
        properties: {
          id: product.id,
          name: product.name,
          distance: calculateDistance(center, product.coordinates),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [product.coordinates.lng, product.coordinates.lat],
        },
      })),
    };

    map.current.addSource("products", {
      type: "geojson",
      data: productsData,
    });

    map.current.addLayer({
      id: "products",
      type: "circle",
      source: "products",
      paint: {
        "circle-radius": 6,
        "circle-color": "#10b981", // green for all products
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": ["case", ["<=", ["get", "distance"], radius], 1, 0.3],
      },
    });

    // Add popup on product click
    map.current.on("click", "products", (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const product = allProducts.find(
          (p) => p.id === feature.properties?.id,
        );

        if (product) {
          new window.mapboxgl.Popup()
            .setLngLat([product.coordinates.lng, product.coordinates.lat])
            .setHTML(
              `
              <div class="p-2">
                <h3 class="font-bold">${product.name}</h3>
                <p class="text-sm text-gray-600">${product.description}</p>
                <p class="text-sm font-semibold text-green-600">${product.price}</p>
                <p class="text-xs text-gray-500">${feature.properties?.distance.toFixed(1)} km away</p>
              </div>
            `,
            )
            .addTo(map.current!);
        }
      }
    });
  };

  // Geocoding search
  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const MAPBOX_TOKEN =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN_HERE";
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=CA&proximity=${center.lng},${center.lat}&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Geocoding error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reverse geocoding
  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    try {
      const MAPBOX_TOKEN =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN_HERE";
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place`,
      );
      const data = await response.json();
      if (data.features && data.features[0]) {
        onAddressChange(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleAddressSelect = (feature: any) => {
    const coords = {
      lat: feature.center[1],
      lng: feature.center[0],
    };
    onLocationChange(coords);
    onAddressChange(feature.place_name);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="w-full">
      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md mt-1 max-h-60 overflow-y-auto z-50 shadow-lg">
            {searchResults.map((feature, index) => (
              <button
                key={index}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 border-b last:border-b-0 border-gray-100 dark:border-gray-700"
                onClick={() => handleAddressSelect(feature)}
              >
                <div className="text-sm font-medium">{feature.text}</div>
                <div className="text-xs text-gray-500">
                  {feature.place_name}
                </div>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="absolute right-3 top-3 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>

      {/* Map container with location button */}
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-64 rounded-lg overflow-hidden border"
          style={{ minHeight: "256px" }}
        />

        {/* Current location button */}
        {onCurrentLocationRequest && (
          <button
            onClick={onCurrentLocationRequest}
            className="absolute top-2 right-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-sm transition-colors"
            title="Use my current location"
          >
            📍
          </button>
        )}
      </div>

      {/* Radius slider */}
      <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium whitespace-nowrap">Radius:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium whitespace-nowrap">
            {radius} km
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Click on the map to set your location
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { authUser, loading } = useAuth();

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({
    center: { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
    radius: 25,
    address: "Toronto, ON",
  });
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "loading"
  >("prompt");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/sign-in");
    }
  }, [authUser, loading, router]);

  // Get user's current location on component mount
  useEffect(() => {
    if (authUser && !loading) {
      getCurrentLocation();
    }
  }, [authUser, loading]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationPermission("loading");

    try {
      // Check if we already have permission
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "denied") {
          setLocationPermission("denied");
          setIsGettingLocation(false);
          return;
        }
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setLocationFilter((prev) => ({
            ...prev,
            center: coords,
          }));

          // Get address for the current location
          await reverseGeocodeCurrentLocation(coords);
          setLocationPermission("granted");
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationPermission("denied");
          setIsGettingLocation(false);

          // Show user-friendly error message based on error type
          let errorMessage = "Unable to get your location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. You can still search for locations manually.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }

          // You could show a toast notification here
          console.log(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setLocationPermission("denied");
      setIsGettingLocation(false);
    }
  };

  const reverseGeocodeCurrentLocation = async (coords: {
    lat: number;
    lng: number;
  }) => {
    try {
      const MAPBOX_TOKEN =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN_HERE";
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place`,
      );
      const data = await response.json();
      if (data.features && data.features[0]) {
        setLocationFilter((prev) => ({
          ...prev,
          address: data.features[0].place_name,
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleLocationChange = (coords: { lat: number; lng: number }) => {
    setLocationFilter((prev) => ({
      ...prev,
      center: coords,
    }));
  };

  const handleRadiusChange = (radius: number) => {
    setLocationFilter((prev) => ({
      ...prev,
      radius,
    }));
  };

  const handleAddressChange = (address: string) => {
    setLocationFilter((prev) => ({
      ...prev,
      address,
    }));
  };

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase());

        const distance = calculateDistance(
          locationFilter.center,
          p.coordinates,
        );
        const matchesLocation = distance <= locationFilter.radius;

        return matchesSearch && matchesLocation;
      })
      .map((p) => ({
        ...p,
        distance: calculateDistance(locationFilter.center, p.coordinates),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [search, locationFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Search input */}

        <Link href="/create-listing">
          <Button
            variant="outline"
            className="cursor-pointer flex-1 w-full md-basis-[20%]"
          >
            Create a listing
          </Button>
        </Link>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 w-full md:basis-[50%]"
        />

        {/* Location filter with map */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[240px] md:basis-[30%] cursor-pointer justify-start relative overflow-hidden"
            >
              <MapPin className="w-4 h-4 mr-2" />
              <div className="flex flex-col items-start pr-5 overflow-hidden">
                <span className="text-sm truncate w-full">
                  {isGettingLocation
                    ? "Getting your location..."
                    : locationFilter.address}
                </span>
                <span className="text-xs text-gray-500">
                  Within {locationFilter.radius} km
                </span>
              </div>
              {isGettingLocation && (
                <div className="absolute right-2 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Choose location</h3>

                {/* Location permission status and retry button */}
                {locationPermission === "denied" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="text-xs"
                  >
                    📍 Use my location
                  </Button>
                )}

                {locationPermission === "granted" && (
                  <div className="flex items-center text-green-600 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Using your location
                  </div>
                )}

                {locationPermission === "loading" && (
                  <div className="flex items-center text-blue-600 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                    Getting location...
                  </div>
                )}
              </div>

              {/* Location permission explanation */}
              {locationPermission === "prompt" && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs text-blue-700 dark:text-blue-300">
                  💡 Allow location access for personalized results near you
                </div>
              )}

              {locationPermission === "denied" && (
                <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900 rounded text-xs text-yellow-700 dark:text-yellow-300">
                  📍 Location access denied. You can search for locations
                  manually or enable location in your browser settings.
                </div>
              )}
            </div>

            {/* Mapbox map */}
            <div className="p-4">
              <MapboxMap
                center={locationFilter.center}
                radius={locationFilter.radius}
                onLocationChange={handleLocationChange}
                onRadiusChange={handleRadiusChange}
                onAddressChange={handleAddressChange}
                onCurrentLocationRequest={getCurrentLocation}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Product grid */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Products</h2>
          <span className="text-sm text-gray-500">
            {filteredProducts.length} item
            {filteredProducts.length !== 1 ? "s" : ""} found
          </span>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 flex flex-col">
            <p className="text-gray-500 mb-4">
              No products found in your search area.
            </p>
            <Link href="/create-listing">
              <Button
                className="cursor-pointer w-auto max-w-xs self-center"
                variant="outline"
              >
                Create a listing with your product instead?
              </Button>
            </Link>
            <Button
              className="cursor-pointer w-auto max-w-xs mt-2 self-center"
              variant="outline"
              onClick={() => {
                setSearch("");
                setLocationFilter((prev) => ({ ...prev, radius: 50 }));
              }}
            >
              Expand search area
            </Button>{" "}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      {product.price}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {product.distance.toFixed(1)} km away
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
