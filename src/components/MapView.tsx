import { useEffect, useRef } from 'react';
import maplibregl, { type Marker } from 'maplibre-gl';
import type { DemoPlace } from '../data/demo';
import { calculateVenueGrade } from '../lib/grades';

interface MapViewProps {
  places: DemoPlace[];
  selectedPlaceId: string | null;
  onSelect: (id: string | null) => void;
}

export default function MapView({ places, selectedPlaceId, onSelect }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const element = mapContainerRef.current;
    if (!element) return;
    const map = new maplibregl.Map({
      container: element,
      style: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
      center: [2.3504, 48.8582],
      zoom: 12.3,
      minZoom: 3,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.on('click', () => onSelectRef.current(null));
    mapRef.current = map;
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(element);
    return () => {
      resize.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = places.map((place) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `place-pin${selectedPlaceId === place.id ? ' is-selected' : ''}`;
      el.setAttribute('aria-label', `Afficher ${place.name}`);
      const label = document.createElement('span');
      label.className = 'place-pin__icon';
      label.textContent = ['☕', '🍝', '🥢', '🥐', '🍓'][place.visual % 5];
      const score = document.createElement('span');
      score.className = 'place-pin__grade';
      score.textContent = calculateVenueGrade(place.posts.filter((post) => post.visibility === 'public'))?.grade ?? '—';
      el.append(label, score);
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        onSelectRef.current(place.id);
      });
      return new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(place.coordinates)
        .addTo(map);
    });
  }, [places, selectedPlaceId]);

  return (
    <div className="map-scene">
      <div className="map-fallback" aria-hidden="true"><span>PARIS</span><span>LE MARAIS</span><span>SAINT-GERMAIN</span></div>
      <div className="map-canvas" ref={mapContainerRef} aria-label="Carte interactive des expériences culinaires" />
      <div className="demo-sticker"><span className="demo-sticker__dot" /> Données de démonstration · Paris</div>
    </div>
  );
}
