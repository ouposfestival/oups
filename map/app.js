let events = [];
let markers = [];

async function initApp() {
  events = await loadEventsFromDB();
  renderMarkers();
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
  var infoImg = div.querySelector('img');
  infoImg.addEventListener('mouseenter', function() { infoImg.src = 'images/gif qui changent/How-does-it-work-2.gif'; });
  infoImg.addEventListener('mouseleave', function() { infoImg.src = 'images/gif qui changent/How-does-it-work-1.gif'; });
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
        .setContent("<div style='text-align:center;'>Want to share your intervention? Click on the map where your artwork is located and tell us about it- Happy to see your contribution!<br><br><small><em>OUPS! Festival is not responsible for submitted interventions.</em></small><br><br>website made by <em>toni</em></div>")
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
  if (event.date) {
    html += `<p><b>${formatDate(event.date)}</b>`;
    if (event.time) html += ` ${event.time}`;
    if (event.dateEnd) html += ` → ${formatDate(event.dateEnd)}`;
    html += `</p>`;
  }
  if (event.place || event.address) {
    html += `<p>`;
    if (event.place) html += `<b>${event.place}</b>`;
    if (event.place && event.address) html += ` - `;
    if (event.address) html += event.address;
    html += `</p>`;
  }
  if (event.contact) {
    html += `<p>Contact : ${event.contact}</p>`;
  }
  if (event.duree) {
    html += `<p>Durée : ${event.duree}</p>`;
  }
  if (event.photo) {
    if (event.photo.startsWith('data:video/')) {
      html += `<video src="${event.photo}" controls style="max-width: 100%; margin-top: 10px;"></video>`;
    } else {
      html += `<img src="${event.photo}" alt="Photo de l'événement" style="max-width: 100%; height: auto; margin-top: 10px;">`;
    }
  }
  if (event.id) {
    html += `<a href="event-detail.html?id=${event.id}" class="see-more-link">see more info !</a>`;
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
  document.getElementById('date-end').value = '';
  document.getElementById('place').value = '';
  document.getElementById('address').value = '';
  document.getElementById('contact').value = '';
  document.getElementById('duree').value = '';
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
  const dateEnd = document.getElementById('date-end').value;
  const place = document.getElementById('place').value.trim();
  const address = document.getElementById('address').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const duree = document.getElementById('duree').value.trim();
  const photoInput = document.getElementById('photo');
  if (!title) {
    alert('Le titre est obligatoire.');
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
    dateEnd,
    place,
    address,
    contact,
    duree
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
    const file = photoInput.files[0];
    if (file.type.startsWith('video/')) {
      // Video: read as data URL directly (no compression)
      const reader = new FileReader();
      reader.onload = async function(ev) {
        newEvent.photo = ev.target.result;
        await saveAndShow(newEvent);
      };
      reader.readAsDataURL(file);
    } else {
      const compressed = await compressImage(file);
      newEvent.photo = compressed;
      await saveAndShow(newEvent);
    }
  } else {
    await saveAndShow(newEvent);
  }
});
