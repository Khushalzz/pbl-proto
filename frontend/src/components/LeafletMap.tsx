import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Issue } from '../types';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  // Picker mode props
  pickerMode?: boolean;
  selectedPos?: [number, number] | null;
  onPositionSelect?: (pos: [number, number]) => void;
  // Multi-issue viewer mode
  issues?: Issue[];
  onSelectIssue?: (issue: Issue) => void;
  // Heatmap mode
  showHeatmap?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [18.5175, 73.8152], // Pune / MIT WPU default
  zoom = 14,
  height = '420px',
  pickerMode = false,
  selectedPos = null,
  onPositionSelect,
  issues = [],
  onSelectIssue,
  showHeatmap = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const issueMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    issueMarkersLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Click handler for picker mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (pickerMode && onPositionSelect) {
        onPositionSelect([e.latlng.lat, e.latlng.lng]);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [pickerMode, onPositionSelect]);

  // Render Picker Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !pickerMode) return;

    if (selectedPos) {
      const icon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (!pickerMarkerRef.current) {
        pickerMarkerRef.current = L.marker(selectedPos, { icon, draggable: true }).addTo(map);
        pickerMarkerRef.current.on('dragend', (ev) => {
          const latlng = (ev.target as L.Marker).getLatLng();
          if (onPositionSelect) onPositionSelect([latlng.lat, latlng.lng]);
        });
      } else {
        pickerMarkerRef.current.setLatLng(selectedPos);
      }
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [selectedPos, pickerMode, onPositionSelect]);

  // Render Issues Markers
  useEffect(() => {
    const layer = issueMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (pickerMode) return;

    const getPinColor = (prio: string, status: string) => {
      if (status === 'Resolved' || status === 'Closed') return '#10b981'; // Green
      if (prio === 'Urgent') return '#ef4444'; // Red
      if (prio === 'High') return '#f97316'; // Orange
      if (prio === 'Medium') return '#eab308'; // Amber
      return '#3b82f6'; // Blue
    };

    issues.forEach((iss) => {
      const lat = iss.location?.latitude;
      const lon = iss.location?.longitude;
      if (lat === undefined || lon === undefined) return;

      const color = getPinColor(iss.priority, iss.status);
      const icon = L.divIcon({
        className: 'custom-issue-pin',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35);">
            <span style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: bold;">!</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([lat, lon], { icon });

      const popupContent = `
        <div style="font-family: inherit; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 700; color: #4b5563;">${iss.issue_id}</span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background: ${color}20; color: ${color}; font-weight: 600;">${iss.status}</span>
          </div>
          <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #111827;">${iss.title}</h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #6b7280;">${iss.category} &bull; ${iss.location?.ward || 'Pune'}</p>
          <div style="font-size: 11px; color: #374151; margin-bottom: 8px;">
            <strong>Priority:</strong> ${iss.priority} &bull; <strong>Verifications:</strong> ${iss.verification_count}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectIssue) onSelectIssue(iss);
      });

      layer.addLayer(marker);
    });
  }, [issues, pickerMode, onSelectIssue]);

  // Render Heatmap Circles Layer (FR-028)
  useEffect(() => {
    const layer = heatmapLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showHeatmap) return;

    issues.forEach((iss) => {
      const lat = iss.location?.latitude;
      const lon = iss.location?.longitude;
      if (lat === undefined || lon === undefined) return;

      const isResolved = iss.status === 'Resolved' || iss.status === 'Closed';
      const radius = iss.priority === 'Urgent' ? 240 : iss.priority === 'High' ? 190 : 140;
      const color = isResolved ? '#10b981' : iss.priority === 'Urgent' ? '#ef4444' : iss.priority === 'High' ? '#f97316' : '#eab308';
      const opacity = isResolved ? 0.2 : 0.45;

      const circle = L.circle([lat, lon], {
        radius,
        color,
        fillColor: color,
        fillOpacity: opacity,
        weight: 1,
      });

      circle.bindTooltip(`<b>Hotspot:</b> ${iss.category} (${iss.priority})<br/>${iss.location.address}`, { sticky: true });
      layer.addLayer(circle);
    });
  }, [issues, showHeatmap]);

  const handleLocateMe = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
        }
        if (pickerMode && onPositionSelect) {
          onPositionSelect([latitude, longitude]);
        }
      },
      () => {
        alert('Could not retrieve your location. Make sure location permissions are enabled.');
      }
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <button
        type="button"
        onClick={handleLocateMe}
        title="Use My Current GPS Location"
        className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.071-7.071l-1.414 1.414M7.343 16.657l-1.414 1.414m12.728 0l-1.414-1.414M7.343 7.343L5.929 5.929M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
        Locate Me
      </button>

      {pickerMode && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-slate-700 shadow-sm border border-slate-200 text-center font-medium pointer-events-none">
          Click anywhere or drag the blue marker to position the issue location
        </div>
      )}
    </div>
  );
};
