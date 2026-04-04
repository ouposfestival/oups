const list = document.getElementById('events-list');

async function renderEvents() {
  let events = await loadEventsFromDB();
  if (!events.length) {
    list.innerHTML = '<p>Aucun événement enregistré.</p>';
    return;
  }
  // Ordre aléatoire
  for (let i = events.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [events[i], events[j]] = [events[j], events[i]];
  }
  let html = events.map((event) => {
    const parts = [];
    if (event.artist) parts.push(`<span class="artist-name">${event.artist}</span>`);
    if (event.place) parts.push(event.place);
    if (event.address) parts.push(`<a class="address" href="map/index.html?eventId=${event.id}">${event.address}</a>`);
    if (event.time) parts.push(event.time);
    const info = parts.length ? ', ' + parts.join(', ') : '';
    return `<p class="event-line"><a href="event-detail.html?id=${event.id}">${event.title}</a>${info}</p>`;
  }).join('');
  list.innerHTML = html;
}
renderEvents();
