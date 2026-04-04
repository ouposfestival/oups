let events = [];
let markers = [];

async function initApp() {
  events = await loadEventsFromDB();
  renderMarkers();

  // zoom to event, if selected via URL
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('eventId');
  if (idParam) {
    const match = events.find(ev => ev.id === idParam);
    if (match) {
      map.setView([match.lat, match.lng], 16);
      showEventInfo(match);
    }
  }
  
}

function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function renderMarkers() {
  clearMarkers();
  events.forEach(ev => {
    const m = addMarker(ev);
    markers.push(m);
  });
}

const map = L.map('map').setView([50.8503, 4.3517], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 19,
}).addTo(map);

// Désactiver le double-click zoom
map.doubleClickZoom.disable();

// Déplacer le contrôle zoom en bas à droite
map.zoomControl.setPosition('bottomright');

// Cacher l'attribution par défaut
map.attributionControl.setPrefix('');

// Ajouter un contrôle info personnalisé
var infoControl = L.control({position: 'bottomleft'});
infoControl.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'info-control');
  div.innerHTML = '<img src="images/gif qui changent/How-does-it-work-1.gif" alt="Info" style="cursor:pointer;">';
  L.DomEvent.on(div, 'click', function(e) {
    L.DomEvent.stopPropagation(e);
    if (creditsVisible) {
      if (creditsPopup) {
        map.closePopup(creditsPopup);
        creditsPopup = null;
      }
      creditsVisible = false;
    } else {
      creditsPopup = L.popup()
        .setLatLng(map.getCenter())
        .setContent("<div style='text-align:center;'>to share your intervention, click on the map where your artwork is and share how much information you like<br><br>website made by <b><em>Toni!</em></b></div>")
        .openOn(map);
      creditsVisible = true;
    }
  });
  return div;
};
infoControl.addTo(map);

// Variables pour la popup
var creditsVisible = false;
var creditsPopup = null;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1];
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

function showEventInfo(event) {
  panel.style.display = 'none';
  panel.classList.add('hidden');
  let html = `<div class="event-info-header"><h2>${event.title}</h2><button id="close-info" aria-label="Fermer">✕</button></div>`;
  if (event.artist) {
    html += `<p>${event.artist}</p>`;
  }
  if (event.date && event.time) {
    html += `<p><b>${formatDate(event.date)}</b> ${event.time}</p>`;
  }
  html += `<p><b>${event.place}</b> - ${event.address}</p>`;
  if (event.photo) {
    html += `<img src="${event.photo}" alt="Photo de l'événement" style="max-width: 100%; height: auto; margin-top: 10px;">`;
  }
  const info = document.getElementById('event-info');
  info.innerHTML = html;
  info.style.display = 'block';
  document.getElementById('close-info').addEventListener('click', function() {
    info.style.display = 'none';
  });
}

// Couleurs par date (09 avril 2026 = violet de base)
const dateColorMap = {};
const dateColors = [
  '#b800ff', '#ff2244', '#00bfff', '#ff8800', '#00cc66',
  '#ff44aa', '#aacc00', '#ff5555', '#22dddd', '#ffcc00',
  '#8844ff', '#44ff88', '#ff6600', '#0088ff', '#cc00cc'
];
function getColorForDate(dateStr) {
  if (!dateStr) return '#b800ff';
  if (dateStr === '2026-04-09') return '#b800ff';
  if (dateColorMap[dateStr]) return dateColorMap[dateStr];
  // Index 0 is reserved for 2026-04-09
  const usedCount = Object.keys(dateColorMap).length;
  dateColorMap[dateStr] = dateColors[(usedCount + 1) % dateColors.length];
  return dateColorMap[dateStr];
}

function addMarker(ev) {
  const color = getColorForDate(ev.date);
  const arrowIcon = L.divIcon({
    className: 'arrow-marker-wrapper',
    html: `<div class="arrow-marker" style="--marker-color:${color}"><div class="pin-head"></div></div>`,
    iconSize: [24, 34],
    iconAnchor: [12, 34],
    popupAnchor: [0, -34]
  });
  const marker = L.marker([ev.lat, ev.lng], { icon: arrowIcon }).addTo(map);
  marker.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    showEventInfo(ev);
  });
  return marker;
}

// Lancer le chargement des événements
initApp();

const panel = document.getElementById('event-panel');
const eventForm = document.getElementById('event-form');
const closeButton = document.getElementById('close-panel');
const coordsOutput = document.getElementById('coords');
const eventInfo = document.getElementById('event-info');
let currentLatLng = null;

function openForm(latlng) {
  panel.style.display = 'block';
  panel.classList.remove('hidden');
  eventInfo.style.display = 'none';
  currentLatLng = latlng;
  coordsOutput.textContent = `(${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`;
  document.getElementById('title').value = '';
  document.getElementById('artist').value = '';
  document.getElementById('date').value = '';
  document.getElementById('time').value = '';
  document.getElementById('place').value = '';
  document.getElementById('address').value = '';
  document.getElementById('description').value = '';
  document.getElementById('photo').value = '';
}

function closeForm() {
  panel.style.display = 'none';
  panel.classList.add('hidden');
}

closeButton.addEventListener('click', closeForm);

eventInfo.addEventListener('click', function(e) {
  e.stopPropagation();
});

panel.addEventListener('click', function(e) {
  e.stopPropagation();
});

map.on('click', function(e) {
  const target = e.originalEvent && e.originalEvent.target;
  if (target && target.closest && target.closest('.leaflet-marker-icon')) {
    return;
  }
  openForm(e.latlng);
});

eventForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!currentLatLng) return;
  const title = document.getElementById('title').value.trim();
  const artist = document.getElementById('artist').value.trim();
  const description = document.getElementById('description').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const place = document.getElementById('place').value.trim();
  const address = document.getElementById('address').value.trim();
  const photoInput = document.getElementById('photo');
  if (!title || !artist || !description || !date || !time || !place || !address) {
    alert('Complète tous les champs pour ajouter un événement.');
    return;
  }

  const newEvent = {
    lat: currentLatLng.lat,
    lng: currentLatLng.lng,
    title,
    artist,
    description,
    date,
    time,
    place,
    address
  };

  async function saveAndShow(ev) {
    const docId = await addEventToDB(ev);
    ev.id = docId;
    events.push(ev);
    const m = addMarker(ev);
    markers.push(m);
    showEventInfo(ev);
    closeForm();
  }

  if (photoInput.files && photoInput.files[0]) {
    const compressed = await compressImage(photoInput.files[0]);
    newEvent.photo = compressed;
    await saveAndShow(newEvent);
  } else {
    await saveAndShow(newEvent);
  }
});
