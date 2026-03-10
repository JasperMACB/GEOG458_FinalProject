mapboxgl.accessToken =
  'pk.eyJ1Ijoiam1hY2IiLCJhIjoiY21reXBnb3psMDl5cDNmb2o4dHZyYW91eSJ9.q2NCoGx9qlVwo9G6safu0g';

const DEFAULT_CENTER = [-122.3321, 47.6062];
const DEFAULT_ZOOM = 10.5;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  minZoom: 9
});

let parkingChart = null;
const stallBuckets = ['0–50', '51–200', '201–500', '500+'];

const detailTypeEl = document.getElementById('detail-type');
const detailContentEl = document.getElementById('detail-content');
const lotCountEl = document.getElementById('lot-count');
const clearSelectionBtn = document.getElementById('clear-selection');

async function loadData() {
  const parkingRes = await fetch('assets/Public_Garages_and_Parking_Lots.geojson');
  const parkingLots = await parkingRes.json();

  const trafficRes = await fetch('assets/Traffic_Flow_Counts.geojson');
  const trafficData = await trafficRes.json();

  const rpzRes = await fetch('assets/Restricted_Parking_Zone_Areas_-5600889579429361619.geojson');
  const rpzAreas = await rpzRes.json();

  map.on('load', () => {
    map.addSource('parkingLots', {
      type: 'geojson',
      data: parkingLots
    });

    map.addLayer({
      id: 'parking-point',
      type: 'circle',
      source: 'parkingLots',
      minzoom: 9,
      paint: {
        'circle-radius': {
          property: 'DEA_STALLS',
          stops: [
            [0, 3],
            [100, 6],
            [500, 12],
            [1000, 18],
            [2000, 25]
          ]
        },
        'circle-color': [
          'match',
          ['get', 'RTE_1HR'],
          ['3', '4'], 'rgb(161,218,180)',
          ['4.9', '5'], 'rgb(65,182,196)',
          ['6', '7'], 'rgb(34,94,168)',
          ['8', '9', '10'], 'rgb(8,37,103)',
          'Permit only', 'rgb(189,0,38)',
          'rgb(180,180,180)'
        ],
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        'circle-opacity': 0.7
      }
    }, 'waterway-label');

    map.addSource('traffic', {
      type: 'geojson',
      data: trafficData
    });

    map.addLayer({
      id: 'traffic-flow',
      type: 'line',
      source: 'traffic',
      paint: {
        'line-width': 2,
        'line-opacity': 0.8,
        'line-color': [
          'interpolate', ['linear'],
          ['get', 'AWDT'],
          0, 'rgb(26,150,65)',
          10000, 'rgb(166,217,106)',
          25000, 'rgb(255,255,191)',
          45000, 'rgb(253,174,97)',
          68500, 'rgb(215,25,28)'
        ]
      }
    }, 'parking-point');

    map.addSource('rpz', {
      type: 'geojson',
      data: rpzAreas
    });

    map.addLayer({
      id: 'rpz-fill',
      type: 'fill',
      source: 'rpz',
      paint: {
        'fill-color': '#a855f7',
        'fill-opacity': 0.18
      }
    }, 'traffic-flow');

    map.addLayer({
      id: 'rpz-outline',
      type: 'line',
      source: 'rpz',
      paint: {
        'line-color': '#c084fc',
        'line-width': 2,
        'line-opacity': 0.9
      }
    });

    bindInteractionEvents(parkingLots);
    bindLayerToggleEvents();
    updateDashboardSummary(parkingLots);
    resetDetailPanel();
  });

  map.on('idle', () => {
    if (map.getSource('parkingLots')) {
      updateDashboardSummary(parkingLots);
    }
  });
}

function bindInteractionEvents(parkingLots) {
  map.on('click', 'parking-point', (e) => {
    const feature = e.features[0];
    const props = feature.properties;

    flyToPoint(feature.geometry.coordinates, 15);

    new mapboxgl.Popup()
      .setLngLat(feature.geometry.coordinates)
      .setHTML(`
        <strong>${props.DEA_FACILITY_NAME || 'Unknown Lot'}</strong><br>
        <strong>Address:</strong> ${props.DEA_FACILITY_ADDRESS || 'N/A'}<br>
        <strong>Stalls:</strong> ${formatValue(props.DEA_STALLS)}<br>
        <strong>Rate/hr:</strong> ${props.RTE_1HR ? '$' + props.RTE_1HR : 'N/A'}
      `)
      .addTo(map);

    showParkingDetails(props);
    updateDashboardSummary(parkingLots);
  });

  map.on('click', 'traffic-flow', (e) => {
    const feature = e.features[0];
    const props = feature.properties;
    const bounds = getLineBounds(feature);

    fitMapToBounds(bounds, 60);

    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>${props.STNAME_ORD || 'Street segment'}</strong><br>
        <strong>Daily Traffic (AWDT):</strong> ${formatNumber(props.AWDT)}<br>
        <strong>AM Peak:</strong> ${formatNumber(props.AMPK)}<br>
        <strong>PM Peak:</strong> ${formatNumber(props.PMPK)}
      `)
      .addTo(map);

    showTrafficDetails(props);
    updateDashboardSummary(parkingLots);
  });

  map.on('click', 'rpz-fill', (e) => {
    const feature = e.features[0];
    const props = feature.properties;
    const bounds = getPolygonBounds(feature);
    const center = getFeatureCenter(feature);

    fitMapToBounds(bounds, 40);

    new mapboxgl.Popup()
      .setLngLat(center)
      .setHTML(`
        <strong>${props.NAME || 'Restricted Parking Zone'}</strong><br>
        <strong>Zone:</strong> ${props.RPZ_ZONE || 'N/A'}<br>
        <strong>Subsidies:</strong> ${props.SUBSIDIES || 'N/A'}<br>
        <strong>Renewal:</strong> ${props.RENEW || 'N/A'}<br>
        <strong>In Effect:</strong> ${props.INEFFECT || 'N/A'}
      `)
      .addTo(map);

    showRPZDetails(props);
    updateDashboardSummary(parkingLots);
  });

  map.on('mouseenter', 'parking-point', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'parking-point', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'traffic-flow', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'traffic-flow', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'rpz-fill', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'rpz-fill', () => {
    map.getCanvas().style.cursor = '';
  });
}

function bindLayerToggleEvents() {
  document.getElementById('toggle-parking').addEventListener('change', function () {
    map.setLayoutProperty(
      'parking-point',
      'visibility',
      this.checked ? 'visible' : 'none'
    );
  });

  document.getElementById('toggle-traffic').addEventListener('change', function () {
    map.setLayoutProperty(
      'traffic-flow',
      'visibility',
      this.checked ? 'visible' : 'none'
    );
  });

  document.getElementById('toggle-rpz').addEventListener('change', function () {
    const visibility = this.checked ? 'visible' : 'none';
    map.setLayoutProperty('rpz-fill', 'visibility', visibility);
    map.setLayoutProperty('rpz-outline', 'visibility', visibility);
  });
}

function updateDashboardSummary(parkingLots) {
  const counts = calParkingLots(parkingLots, map.getBounds());
  const total = calTotalStalls(parkingLots, map.getBounds());

  lotCountEl.textContent = total;

  const x = ['bucket', ...stallBuckets];
  const y = ['#', ...stallBuckets.map((b) => counts[b])];

  if (!parkingChart) {
    parkingChart = c3.generate({
      bindto: '#parking-chart',
      size: { height: 280, width: 455 },
      data: {
        x: 'bucket',
        columns: [x, y],
        type: 'bar',
        colors: {
          '#': 'rgb(65,182,196)'
        }
      },
      axis: {
        x: { type: 'category' },
        y: {
          label: {
            text: '# Lots',
            position: 'outer-middle'
          }
        }
      },
      legend: { show: false }
    });
  } else {
    parkingChart.load({ columns: [x, y] });
  }
}

function showParkingDetails(props) {
  detailTypeEl.textContent = 'Parking Lot';

  detailContentEl.innerHTML = `
    <div class="detail-row"><span class="detail-label">Facility:</span> ${escapeHtml(props.DEA_FACILITY_NAME || 'Unknown Lot')}</div>
    <div class="detail-row"><span class="detail-label">Address:</span> ${escapeHtml(props.DEA_FACILITY_ADDRESS || 'N/A')}</div>
    <div class="detail-row"><span class="detail-label">Total Stalls:</span> ${formatValue(props.DEA_STALLS)}</div>
    <div class="detail-row"><span class="detail-label">Hourly Rate:</span> ${props.RTE_1HR ? '$' + escapeHtml(props.RTE_1HR) : 'N/A'}</div>
    <div class="detail-row"><span class="detail-label">Type:</span> Public Garage / Parking Lot</div>
    <div class="detail-row"><span class="detail-label">Interaction:</span> Map zoomed to selected parking location.</div>
  `;
}

function showTrafficDetails(props) {
  detailTypeEl.textContent = 'Traffic Segment';

  detailContentEl.innerHTML = `
    <div class="detail-row"><span class="detail-label">Street:</span> ${escapeHtml(props.STNAME_ORD || 'Unknown street')}</div>
    <div class="detail-row"><span class="detail-label">Average Daily Traffic:</span> ${formatNumber(props.AWDT)}</div>
    <div class="detail-row"><span class="detail-label">AM Peak:</span> ${formatNumber(props.AMPK)}</div>
    <div class="detail-row"><span class="detail-label">PM Peak:</span> ${formatNumber(props.PMPK)}</div>
    <div class="detail-row"><span class="detail-label">Type:</span> Traffic Flow Segment</div>
    <div class="detail-row"><span class="detail-label">Interaction:</span> Map zoomed to selected road segment.</div>
  `;
}

function showRPZDetails(props) {
  detailTypeEl.textContent = 'Restricted Parking Zone';

  detailContentEl.innerHTML = `
    <div class="detail-row"><span class="detail-label">Name:</span> ${escapeHtml(props.NAME || 'Restricted Parking Zone')}</div>
    <div class="detail-row"><span class="detail-label">Zone:</span> ${escapeHtml(props.RPZ_ZONE || 'N/A')}</div>
    <div class="detail-row"><span class="detail-label">Subsidies:</span> ${escapeHtml(props.SUBSIDIES || 'N/A')}</div>
    <div class="detail-row"><span class="detail-label">Renewal:</span> ${escapeHtml(props.RENEW || 'N/A')}</div>
    <div class="detail-row"><span class="detail-label">In Effect:</span> ${escapeHtml(props.INEFFECT || 'N/A')}</div>
    <div class="detail-row"><span class="detail-label">Type:</span> Area-based parking restriction</div>
    <div class="detail-row"><span class="detail-label">Interaction:</span> Map zoomed to selected RPZ boundary.</div>
  `;
}

function resetDetailPanel() {
  detailTypeEl.textContent = 'Nothing selected';
  detailContentEl.innerHTML = `
    Click any parking lot, traffic segment, or restricted parking zone on the map to zoom in and view its details here.
  `;
}

function calTotalStalls(data, bounds) {
  return data.features
    .filter((f) => bounds.contains(f.geometry.coordinates))
    .reduce((sum, f) => sum + (Number(f.properties.DEA_STALLS) || 0), 0);
}

function calParkingLots(data, bounds) {
  const counts = {
    '0–50': 0,
    '51–200': 0,
    '201–500': 0,
    '500+': 0
  };

  data.features.forEach((f) => {
    if (bounds.contains(f.geometry.coordinates)) {
      const stalls = Number(f.properties.DEA_STALLS) || 0;

      if (stalls <= 50) counts['0–50']++;
      else if (stalls <= 200) counts['51–200']++;
      else if (stalls <= 500) counts['201–500']++;
      else counts['500+']++;
    }
  });

  return counts;
}

function flyToPoint(coords, zoom = 15) {
  map.flyTo({
    center: coords,
    zoom: zoom,
    speed: 0.9,
    curve: 1.2,
    essential: true
  });
}

function fitMapToBounds(bounds, padding = 50) {
  map.fitBounds(bounds, {
    padding: padding,
    duration: 1200,
    essential: true
  });
}

function getLineBounds(feature) {
  const bounds = new mapboxgl.LngLatBounds();
  const coords = feature.geometry.coordinates;

  coords.forEach((coord) => bounds.extend(coord));
  return bounds;
}

function getPolygonBounds(feature) {
  const bounds = new mapboxgl.LngLatBounds();
  const geometry = feature.geometry;

  if (geometry.type === 'Polygon') {
    geometry.coordinates[0].forEach((coord) => bounds.extend(coord));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      polygon[0].forEach((coord) => bounds.extend(coord));
    });
  }

  return bounds;
}

function getFeatureCenter(feature) {
  const bounds = getPolygonBounds(feature);
  return bounds.getCenter();
}

function formatNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : 'N/A';
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') {
    return 'N/A';
  }
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : escapeHtml(String(value));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.getElementById('reset').addEventListener('click', (e) => {
  e.preventDefault();
  map.flyTo({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    essential: true
  });
});

clearSelectionBtn.addEventListener('click', () => {
  resetDetailPanel();
});

loadData();