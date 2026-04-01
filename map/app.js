const storageKey = 'oups-events-v1';

function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function saveEvents() {
  localStorage.setItem(storageKey, JSON.stringify(events));
}

const savedEvents = loadEvents();
const events = savedEvents;

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
  div.innerHTML = '<button id="info-btn" title="Informations">i</button>';
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
        .setContent('oups@cutey.com, website made by <em>Toni!</em>')
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

function addMarker(ev) {
  const arrowIcon = L.divIcon({
    className: 'arrow-marker-wrapper',
    html: '<div class="arrow-marker"><div class="pin-head"></div></div>',
    iconSize: [24, 34],
    iconAnchor: [12, 34],
    popupAnchor: [0, -34]
  });
  const marker = L.marker([ev.lat, ev.lng], { icon: arrowIcon }).addTo(map);
  marker.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    showEventInfo(ev);
  });
}

function renderMarkers() {
  events.forEach(addMarker);
}

renderMarkers();

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

eventForm.addEventListener('submit', function(e) {
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

  if (photoInput.files && photoInput.files[0]) {
    const file = photoInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      newEvent.photo = e.target.result; // base64 string
      events.push(newEvent);
      saveEvents();
      addMarker(newEvent);
      showEventInfo(newEvent);
      closeForm();
    };
    reader.readAsDataURL(file);
  } else {
    events.push(newEvent);
    saveEvents();
    addMarker(newEvent);
    showEventInfo(newEvent);
    closeForm();
  }
});
