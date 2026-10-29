import React, { useEffect, useRef, useState } from 'react';
import { LiveOrder } from '../types';
import {
  Truck,
  Car,
  Phone,
  MessageSquare,
  Navigation,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  LocateFixed,
  Maximize2
} from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { getDriverVehicleInfo } from '../services/driverService';

interface LiveDriverMapProps {
  order: LiveOrder;
}

// Comprehensive GPS coordinates for Pinetown & Upper Highway delivery zones
const SUBURB_COORDINATES: Record<string, [number, number]> = {
  // Zone 1: Pinetown Central & immediate surroundings (0–3 km)
  pinetown: [-29.8156, 30.8544],
  'hatton estate': [-29.8315, 30.8532],
  hatton: [-29.8315, 30.8532],
  ashley: [-29.8360, 30.8420],
  manors: [-29.8090, 30.8510],
  'the wolds': [-29.7995, 30.8610],
  wolds: [-29.7995, 30.8610],
  'farningham ridge': [-29.8410, 30.8350],
  'highland hills': [-29.8480, 30.8440],

  // Zone 2: Near suburbs (3–6 km)
  'new germany': [-29.8050, 30.8750],
  sarnia: [-29.8450, 30.8650],
  'cowies hill': [-29.8320, 30.8920],
  cowies: [-29.8320, 30.8920],
  'paradise valley': [-29.8420, 30.8870],
  'padfield park': [-29.8120, 30.8320],
  moseley: [-29.8490, 30.8800],
  cleremont: [-29.7950, 30.8950],

  // Zone 3: Intermediate Upper Highway & Westville (6–10 km)
  westville: [-29.8290, 30.9288],
  kloof: [-29.7865, 30.8327],
  wyebank: [-29.7820, 30.8790],
  mariannhill: [-29.8650, 30.8350],
  'chiltern hills': [-29.8180, 30.9150],

  // Zone 4: Hillcrest, Waterfall & Upper Highway (10–14 km)
  hillcrest: [-29.7788, 30.7634],
  waterfall: [-29.7485, 30.8122],
  gillitts: [-29.7995, 30.7788],
  'winston park': [-29.8055, 30.7938],
  winston: [-29.8055, 30.7938],
  assagay: [-29.7891, 30.7421],
  'bothas hill': [-29.7523, 30.7381],
  botha: [-29.7523, 30.7381],
  everton: [-29.7820, 30.7980],
  'forest hills': [-29.7610, 30.8250],
  crestholme: [-29.7350, 30.8320],
  durban: [-29.8580, 31.0210],
};

// Shop 1, Uniland Centre, 24 Anderson Rd, Pinetown
const RESTAURANT_COORDS: [number, number] = [-29.8156, 30.8544];

function resolveDestinationCoords(
  suburb?: string,
  address?: string,
  lat?: number,
  lng?: number
): [number, number] {
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0) {
    return [lat, lng];
  }

  const query = `${suburb || ''} ${address || ''}`.toLowerCase();
  const keys = Object.keys(SUBURB_COORDINATES).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (query.includes(k)) {
      return SUBURB_COORDINATES[k];
    }
  }

  return SUBURB_COORDINATES['pinetown'];
}

function computeHaversineRoadKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straight = R * c;
  // Road curvature factor for highway/arterial road routes in Durban Upper Highway
  return straight * 1.34;
}

function computeEtaMinutes(distanceKm: number, speedKmh = 42): number {
  if (distanceKm <= 0.3) return 1;
  const drivingMinutes = (distanceKm / speedKmh) * 60;
  return Math.max(1, Math.round(drivingMinutes + 2));
}

function generateRealisticRoutePoints(
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const isWestUpperHighway = end[1] < 30.840;
  const isFarWest = end[1] < 30.790; // Gillitts, Hillcrest, Assagay, Bothas Hill

  const waypoints: [number, number][] = [start];

  if (isFarWest) {
    // M13 Highway corridor through Fields Hill -> Kloof -> Gillitts -> Hillcrest
    waypoints.push(
      [-29.8115, 30.8490], // Josiah Gumede / M13 onramp
      [-29.8040, 30.8380], // Fields Hill M13
      [-29.7890, 30.8280], // Kloof Pioneer Rd M13
      [-29.7960, 30.7850], // Gillitts M13
      [-29.7840, 30.7720]  // Old Main Rd Hillcrest offramp
    );
  } else if (isWestUpperHighway) {
    // Kloof / Wyebank
    waypoints.push(
      [-29.8115, 30.8490],
      [-29.8040, 30.8380],
      [-29.7890, 30.8280]
    );
  }

  waypoints.push(end);

  const fullRoute: [number, number][] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const steps = 8;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      fullRoute.push([
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t,
      ]);
    }
  }
  fullRoute.push(end);
  return fullRoute;
}

function getDynamicRoadDescription(
  remainingKm: number,
  suburbName: string
): string {
  if (remainingKm <= 0.8) {
    return `Turning into your street • Approaching gate in ${suburbName}`;
  }
  if (remainingKm <= 2.0) {
    return `Arriving in ${suburbName} • 2 mins away`;
  }

  const sub = suburbName.toLowerCase();
  if (sub.includes('hillcrest') || sub.includes('assagay') || sub.includes('botha')) {
    if (remainingKm > 9.0) {
      return 'M13 Highway • Climbing Fields Hill towards Kloof';
    }
    if (remainingKm > 4.5) {
      return 'M13 Highway • Cruising through Kloof & Gillitts';
    }
    return 'Old Main Road • Entering Hillcrest';
  }

  if (sub.includes('waterfall') || sub.includes('crestholme') || sub.includes('forest hills')) {
    if (remainingKm > 8.0) {
      return 'M13 Highway / Inanda Road towards Waterfall';
    }
    return `Inanda Road • Entering ${suburbName}`;
  }

  if (sub.includes('kloof')) {
    if (remainingKm > 4.0) {
      return 'M13 Highway • Ascending Fields Hill';
    }
    return 'Old Main Road / Village Road, Kloof';
  }

  if (sub.includes('westville')) {
    return 'M13 Highway East towards Westville';
  }

  if (sub.includes('new germany')) {
    return 'Qashana Khuzwayo / Shepstone Road, New Germany';
  }

  if (sub.includes('cowies') || sub.includes('sarnia')) {
    return `En route to ${suburbName} via arterial road`;
  }

  return `En route to ${suburbName} (${remainingKm.toFixed(1)} km away)`;
}

export const LiveDriverMap: React.FC<LiveDriverMapProps> = ({ order }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  const customer = order.customer || {
    customerName: 'Customer',
    phone: '',
    address: 'Pinetown',
    suburb: 'Pinetown',
  };
  const suburbName = customer.suburb || 'Pinetown';

  const destCoords: [number, number] = resolveDestinationCoords(
    customer.suburb,
    customer.address,
    customer.latitude,
    customer.longitude
  );

  const totalDistanceKm = computeHaversineRoadKm(
    RESTAURANT_COORDS[0],
    RESTAURANT_COORDS[1],
    destCoords[0],
    destCoords[1]
  );
  const initialEta = computeEtaMinutes(totalDistanceKm, 42);

  const [driverProgress, setDriverProgress] = useState(0.05);
  const [distanceKm, setDistanceKm] = useState<string>(() => `${totalDistanceKm.toFixed(1)} km`);
  const [etaMins, setEtaMins] = useState<number>(() => initialEta);
  const [driverCurrentRoad, setDriverCurrentRoad] = useState<string>(() =>
    getDynamicRoadDescription(totalDistanceKm, suburbName)
  );
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(38);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const routePoints = generateRealisticRoutePoints(RESTAURANT_COORDS, destCoords);
  const driverDisplay = getDriverVehicleInfo(order.driverId, order.driverName);

  // Initialize Leaflet Map with CartoDB Dark Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      // 1. Inject Leaflet CSS if not already loaded
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Inject Leaflet JS if not available
      if (!(window as any).L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      if (!isMounted || !mapContainerRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      // Clean up previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [
          (RESTAURANT_COORDS[0] + destCoords[0]) / 2,
          (RESTAURANT_COORDS[1] + destCoords[1]) / 2,
        ],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // High-performance Dark Basemap (Esri World Dark Gray Base - No API key required)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 16,
          attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        }
      ).addTo(map);

      // Custom HTML Icons
      const storeIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background:#dc2626;color:white;padding:6px;border-radius:12px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.6);font-size:16px;display:flex;align-items:center;justify-content:center;width:34px;height:34px;">
            🍗
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const customerIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background:#10b981;color:white;padding:6px;border-radius:12px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.6);font-size:16px;display:flex;align-items:center;justify-content:center;width:34px;height:34px;">
            🏠
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const isCar = driverDisplay.vehicleType === 'light_vehicle';
      const driverIconHtml = isCar
        ? `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(239,68,68,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="background:linear-gradient(135deg, #f59e0b, #ef4444);color:white;border-radius:50%;width:36px;height:36px;border:3px solid white;box-shadow:0 4px 15px rgba(245,158,11,0.8);display:flex;align-items:center;justify-content:center;position:relative;z-index:2;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 13v3c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>
        `
        : `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(239,68,68,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="background:linear-gradient(135deg, #f59e0b, #ef4444);color:white;border-radius:50%;width:36px;height:36px;border:3px solid white;box-shadow:0 4px 15px rgba(245,158,11,0.8);display:flex;align-items:center;justify-content:center;position:relative;z-index:2;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                <rect x="2" y="5.5" width="6.5" height="7" rx="1" />
                <line x1="2" y1="9" x2="8.5" y2="9" />
                <circle cx="5.5" cy="18" r="2.5" />
                <circle cx="18.5" cy="18" r="2.5" />
                <line x1="5.5" y1="12.5" x2="5.5" y2="15.5" />
                <path d="M8.5 12.5h3l2.5-3.5h2.5" />
                <line x1="15" y1="6.5" x2="17.5" y2="6.5" />
                <line x1="16.5" y1="6.5" x2="16.5" y2="9" />
                <line x1="16.5" y1="9" x2="18.5" y2="18" />
                <path d="M8 18h4l2-3.5" />
              </svg>
            </div>
          </div>
        `;

      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: driverIconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Add Restaurant Marker
      L.marker(RESTAURANT_COORDS, { icon: storeIcon })
        .addTo(map)
        .bindPopup('<b>Wrap & Wings Co.</b><br>Shop 1, Uniland Centre');

      // Add Destination Marker
      L.marker(destCoords, { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>Delivery Address</b><br>${customer.address || suburbName}`);

      // Add Route Line (Glowing Rose / Amber gradient styling)
      const polyline = L.polyline(routePoints, {
        color: '#f43f5e',
        weight: 5,
        opacity: 0.85,
        dashArray: '1, 8',
        lineCap: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Initial Driver Position: check if real GPS exists on order, otherwise use route start
      const hasLiveGps =
        order.driverLocation &&
        typeof order.driverLocation.latitude === 'number' &&
        typeof order.driverLocation.longitude === 'number';

      const initialPos = hasLiveGps
        ? [order.driverLocation!.latitude, order.driverLocation!.longitude]
        : routePoints[0];

      const driverMarker = L.marker(initialPos, { icon: driverIcon }).addTo(map);
      driverMarkerRef.current = driverMarker;

      // Fit map bounds to show full route
      const bounds = L.latLngBounds([RESTAURANT_COORDS, destCoords]);
      map.fitBounds(bounds, { padding: [40, 40] });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      setIsMapLoaded(true);
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [suburbName, destCoords[0], destCoords[1], driverDisplay.vehicleType]);

  // LIVE GPS UPDATE: React immediately when live driver GPS updates from Firestore / device
  useEffect(() => {
    if (!order.driverLocation) return;
    const { latitude, longitude, speed } = order.driverLocation;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const currentPos: [number, number] = [latitude, longitude];

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(currentPos);
    }

    const remainingKm = computeHaversineRoadKm(
      latitude,
      longitude,
      destCoords[0],
      destCoords[1]
    );

    const speedVal = typeof speed === 'number' && speed > 0 ? speed : 42;
    setCurrentSpeedKmh(speedVal);

    const eta = computeEtaMinutes(remainingKm, speedVal);
    setDistanceKm(`${remainingKm.toFixed(1)} km`);
    setEtaMins(eta);
    setDriverCurrentRoad(getDynamicRoadDescription(remainingKm, suburbName));
  }, [order.driverLocation, destCoords, suburbName]);

  // Continuous movement telemetry fallback (while awaiting GPS or between pings)
  useEffect(() => {
    if (order.status !== 'dispatched' && order.status !== 'ready') return;
    // If live GPS is already fresh (< 15 seconds old), let live GPS drive the marker
    if (order.driverLocation && Date.now() - order.driverLocation.updatedAt < 15000) return;

    const interval = setInterval(() => {
      setDriverProgress((prev) => {
        const next = prev >= 0.95 ? 0.95 : prev + 0.012;

        if (driverMarkerRef.current && routePoints.length > 0) {
          const idx = Math.min(
            Math.floor(next * (routePoints.length - 1)),
            routePoints.length - 1
          );
          const newPos = routePoints[idx];
          driverMarkerRef.current.setLatLng(newPos);
        }

        const remainingFraction = Math.max(0.04, 1.0 - next);
        const remainingKm = Math.max(0.2, remainingFraction * totalDistanceKm);
        const remainingMinutes = computeEtaMinutes(remainingKm, 42);

        setDistanceKm(`${remainingKm.toFixed(1)} km`);
        setEtaMins(remainingMinutes);
        setDriverCurrentRoad(getDynamicRoadDescription(remainingKm, suburbName));

        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [order.status, order.driverLocation, routePoints, suburbName, totalDistanceKm]);

  const handleCenterDriver = () => {
    if (!mapInstanceRef.current || !driverMarkerRef.current) return;
    const pos = driverMarkerRef.current.getLatLng();
    mapInstanceRef.current.setView(pos, 16, { animate: true });
  };

  const handleViewFullRoute = () => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const bounds = L.latLngBounds([RESTAURANT_COORDS, destCoords]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
  };

  const assignedDriverName = order.driverName || driverDisplay.displayName;
  const cleanCustomerAddress = `${order.customer.address}, ${order.customer.suburb}`;
  const whatsAppDriverUrl = `https://wa.me/${driverDisplay.cleanWaPhone}?text=${encodeURIComponent(
    `Hi ${assignedDriverName} (Wrap & Wings Driver), I am tracking Order #${order.orderId} to ${cleanCustomerAddress}.${
      order.customer.gateCode ? ` Gate Code: ${order.customer.gateCode}.` : ''
    }`
  )}`;

  return (
    <div className="rounded-3xl bg-[#14141c] border-2 border-rose-500/50 shadow-2xl overflow-hidden flex flex-col space-y-0">
      
      {/* Map Header Status Bar */}
      <div className="p-4 bg-zinc-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base">
            <DeliveryMotorbikeIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
              <span>LIVE DRIVER GPS TRACKER</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[11px] text-zinc-400">
              {driverCurrentRoad}
            </div>
          </div>
        </div>

        {/* ETA & Distance Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-right">
            <div className="text-[9px] font-black uppercase text-zinc-400">Distance</div>
            <div className="text-xs font-black text-amber-400">{distanceKm} away</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs sm:text-sm shadow-md">
            ETA: {etaMins} mins
          </div>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-72 sm:h-80 bg-zinc-950 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Map Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCenterDriver}
            className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
            title="Focus on Driver"
          >
            <LocateFixed className="w-4 h-4 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={handleViewFullRoute}
            className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
            title="View Full Route"
          >
            <Maximize2 className="w-4 h-4 text-zinc-300" />
          </button>
        </div>

        {/* Live Speed & Sensor Overlay */}
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-black/80 border border-white/15 backdrop-blur-md flex items-center gap-2 text-[10px] text-zinc-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>Vehicle Speed: <strong className="text-white">{currentSpeedKmh} km/h</strong></span>
          <span>•</span>
          <span className="text-amber-300">🔥 Hot Bag Sealed (72°C)</span>
        </div>
      </div>

      {/* Driver Identity & Direct Contact Card (Uber Eats style) */}
      <div className="p-4 sm:p-5 bg-[#171720] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Driver Profile */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center font-black text-white shadow-lg shadow-rose-950/60">
              {driverDisplay.vehicleType === 'light_vehicle' ? (
                <Car className="w-6 h-6 text-white" />
              ) : (
                <DeliveryMotorbikeIcon className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-400 text-zinc-950" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white">{assignedDriverName}</h4>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                4.9 ⭐ (1,240 drops)
              </span>
            </div>
            <div className="text-xs text-zinc-300 mt-0.5">
              {driverDisplay.vehicleText} • <span className="font-mono text-zinc-400">{driverDisplay.vehicleReg}</span>
            </div>
          </div>
        </div>

        {/* Direct Call / WhatsApp Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={driverDisplay.callUrl}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Driver</span>
          </a>

          <a
            href={whatsAppDriverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/60 transition-transform hover:scale-105 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white" />
            <span>WhatsApp Driver</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

      </div>

    </div>
  );
};
