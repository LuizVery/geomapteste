import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DataMapped, setupData, postSelection } from '@sassoftware/va-report-components';
import ColorPalette from './ColorPalette';
import './Geowebmap.css';

// Define the props that will be passed into the component
interface GeowebmapProps {
  data: DataMapped;
  height: number;
  width: number;
  markerSize: number;
  fillOpacity: number;
  displayMode: string; // Nossa nova propriedade!
}

// As a functional component, this is the main logic block.
const Geowebmap = (props: GeowebmapProps) => {
  // Create a ref to hold the map instance.
  const mapRef = useRef<L.Map>(null);
  // Create a ref for the div element that will contain the map.
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Create a ref to hold the layer of markers.
  const markersRef = useRef<L.LayerGroup>(null);
  // Create a ref to hold the data mapping details.
  const dataMappingRef = useRef(null);

  // This useEffect hook initializes the map. It runs only once.
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      (mapRef as any).current = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: false
      }).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
  }, []);

  // This is the CORE useEffect. It runs whenever the data or options change.
  // This is the correct place to update the markers.
  useEffect(() => {
    if (!props.data || !mapRef.current) {
      return;
    }

    const { data, dataMap } = setupData(props.data);
    dataMappingRef.current = dataMap;

    if (markersRef.current) {
      markersRef.current.clearLayers();
    } else {
      (markersRef as any).current = L.layerGroup().addTo(mapRef.current);
    }

    const latVar = dataMap.get('latitude');
    const longVar = dataMap.get('longitude');
    const locationVar = dataMap.get('location');
    const colorVar = dataMap.get('color');
    const measureVar = dataMap.get('measure');
    const measureLabel = measureVar?.label;

    const colors = colorVar ? new ColorPalette(data.map(row => row[colorVar.name])) : null;

    // INÍCIO DA NOVA LÓGICA
    // Calcula o total da medida ANTES do loop, se o modo "Percentual" estiver ativo.
    let totalMeasure = 0;
    if (props.displayMode === 'Percentual' && measureVar) {
        totalMeasure = data.reduce((sum, row) => sum + (parseFloat(row[measureVar.name]) || 0), 0);
    }
    // FIM DA NOVA LÓGICA

    data.forEach((row, index) => {
      const lat = parseFloat(row[latVar.name]);
      const long = parseFloat(row[longVar.name]);

      if (isNaN(lat) || isNaN(long)) {
        return;
      }

      const location = locationVar ? row[locationVar.name] : `${lat}, ${long}`;

      // INÍCIO DA NOVA LÓGICA
      // Decide o que exibir (número ou percentual) com base na opção selecionada.
      let displayValue;
      if (props.displayMode === 'Percentual' && measureVar) {
          const value = parseFloat(row[measureVar.name]) || 0;
          const percentage = totalMeasure > 0 ? (value / totalMeasure) * 100 : 0;
          displayValue = percentage.toFixed(1) + '%';
      } else if (measureVar) {
          const value = parseFloat(row[measureVar.name]) || 0;
          displayValue = value.toLocaleString();
      }
      const popupContent = `<b>${location}</b>${measureVar ? `<br>${measureLabel}: ${displayValue}` : ''}`;
      // FIM DA NOVA LÓGICA

      const markerOptions: L.CircleMarkerOptions = {
        color: 'gray',
        fillColor: colors ? colors.getColor(row[colorVar.name]) : '#3388ff',
        weight: 1,
        opacity: 1,
        fillOpacity: props.fillOpacity || 0.7,
        radius: props.markerSize || 10
      };

      const marker = L.circleMarker([lat, long], markerOptions);
      marker.bindPopup(popupContent + (colors ? `<br>${colorVar.label}: ${row[colorVar.name]}` : ''));
      marker.on('click', () => postSelection(dataMap.get('selection'), [index]));
      markersRef.current.addLayer(marker);
    });

    if (markersRef.current.getLayers().length > 0) {
        mapRef.current.fitBounds(markersRef.current.getBounds());
    }

  }, [props.data, props.markerSize, props.fillOpacity, props.displayMode]);

  return (
    <div className="Geowebmap" style={{ height: props.height, width: props.width }}>
      <div id="map" ref={mapContainerRef} />
    </div>
  );
};

export default Geowebmap;
