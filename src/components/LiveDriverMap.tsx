import React, { useEffect, useRef, useState } from 'react';
import { LiveOrder } from '../types';
import {
  Truck,
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

interface LiveDriverMapProps {
  order: LiveOrder;
}

// Suburb GPS coordinates around Pinetown / Greater Durban
const SUBURB_COORDINATES: Record<string, [number, number]> = {
  Pinetown: [-29.825, 30.865],
  'New Germany': [-29.805, 30.875],
  Westville: [-29.833, 30.933],
  'Cowies Hill': [-29.83, 30.89],
  Kloof: [-29.785, 30.825],
  Sarnia: [-29.845, 30.865],
  Moseley: [-29.849, 30.88],
  Hatton: [-29.832, 30.855],
  Cleremont: [-29.795, 30.895],
  Durban: [-29.858, 31.021],
};

// Shop 1, Uniland Centre, Pinetown
const RESTAURANT_COORDS: [number, number] = [-29.8156, 30.8544];

export const LiveDriverMap: React.FC<LiveDriverMapProps> = ({ order }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  const [driverProgress, setDriverProgress] = useState(0.35); // 0.0 to 1.0 along the route
  const [distanceKm, setDistanceKm] = useState('2.4 km');
  const [etaMins, setEtaMins] = useState(12);
  const [driverCurrentRoad, setDriverCurrentRoad] = useState('Josiah Gumede Road, Pinetown');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const customer = order.customer || {
    customerName: 'Customer',
    phone: '',
    address: 'Pinetown',
    suburb: 'Pinetown',
  };
  const suburbName = customer.suburb || 'Pinetown';
  const destCoords: [number, number] =
    SUBURB_COORDINATES[suburbName] || SUBURB_COORDINATES['Pinetown'];

  // Interpolate route points between Shop and Customer
  const generateRoutePoints = (
    start: [number, number],
    end: [number, number],
    steps = 25
  ): [number, number][] => {
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Add slight road curvature variation
      const curve = Math.sin(t * Math.PI) * 0.003;
      const lat = start[0] + (end[0] - start[0]) * t + curve;
      const lng = start[1] + (end[1] - start[1]) * t - curve * 0.5;
      points.push([lat, lng]);
    }
    return points;
  };

  const routePoints = generateRoutePoints(RESTAURANT_COORDS, destCoords);

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

      // High-performance Dark Basemap (Esri World Dark Gray Base - No API key required, no watermarks)
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

      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(239,68,68,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="background:linear-gradient(135deg, #f59e0b, #ef4444);color:white;border-radius:50%;width:36px;height:36px;border:3px solid white;box-shadow:0 4px 15px rgba(245,158,11,0.8);display:flex;align-items:center;justify-content:center;font-size:18px;position:relative;z-index:2;">
              🛵
            </div>
          </div>
        `,
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

      // Initial Driver Position
      const initialIdx = Math.floor(driverProgress * (routePoints.length - 1));
      const initialPos = routePoints[initialIdx];

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
  }, [suburbName]);

  // Live Driver Movement Animation Simulation
  useEffect(() => {
    // If order is dispatched, smoothly advance the driver position
    if (order.status !== 'dispatched' && order.status !== 'ready') return;

    const interval = setInterval(() => {
      setDriverProgress((prev) => {
        const next = prev >= 0.95 ? 0.95 : prev + 0.015;

        // Update driver marker on Leaflet map
        if (driverMarkerRef.current && routePoints.length > 0) {
          const idx = Math.min(
            Math.floor(next * (routePoints.length - 1)),
            routePoints.length - 1
          );
          const newPos = routePoints[idx];
          driverMarkerRef.current.setLatLng(newPos);
        }

        // Calculate realistic remaining telemetry
        const remainingFraction = 1.0 - next;
        const remainingKm = (remainingFraction * 3.8).toFixed(1);
        const remainingMinutes = Math.max(2, Math.round(remainingFraction * 18));

        setDistanceKm(`${remainingKm} km`);
        setEtaMins(remainingMinutes);

        if (next > 0.8) {
          setDriverCurrentRoad('Turning into your street • Approaching gate');
        } else if (next > 0.5) {
          setDriverCurrentRoad(`Entering ${suburbName} • Moving at 42 km/h`);
        } else {
          setDriverCurrentRoad('Josiah Gumede Road, Pinetown');
        }

        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [order.status, routePoints, suburbName]);

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

  const cleanDriverPhone = '0832763273';
  const cleanCustomerAddress = `${order.customer.address}, ${order.customer.suburb}`;
  const whatsAppDriverUrl = `https://wa.me/27832763273?text=${encodeURIComponent(
    `Hi Sipho (Wrap & Wings Driver), I am tracking Order #${order.orderId} to ${cleanCustomerAddress}.${
      order.customer.gateCode ? ` Gate Code: ${order.customer.gateCode}.` : ''
    }`
  )}`;

  return (
    <div className="rounded-3xl bg-[#14141c] border-2 border-rose-500/50 shadow-2xl overflow-hidden flex flex-col space-y-0">
      
      {/* Map Header Status Bar */}
      <div className="p-4 bg-zinc-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base">
            🛵
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
          <span>Vehicle Speed: <strong className="text-white">38 km/h</strong></span>
          <span>•</span>
          <span className="text-amber-300">🔥 Hot Bag Sealed (72°C)</span>
        </div>
      </div>

      {/* Driver Identity & Direct Contact Card (Uber Eats style) */}
      <div className="p-4 sm:p-5 bg-[#171720] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Driver Profile */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-rose-950/60">
              🛵
            </div>
            <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-400 text-zinc-950" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white">Sipho M.</h4>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                4.9 ⭐ (1,240 drops)
              </span>
            </div>
            <div className="text-xs text-zinc-300 mt-0.5">
              White Honda Delivery Bike • <span className="font-mono text-zinc-400">ND 482-910</span>
            </div>
          </div>
        </div>

        {/* Direct Call / WhatsApp Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={`tel:${cleanDriverPhone}`}
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
