const list = document.getElementById('events-list');

async function renderEvents() {
  const events = await loadEventsFromDB();
  if (!events.length) {
    list.innerHTML = '<p>Aucun événement enregistré.</p>';
    return;
  }
  let html = events.map((event) => {
    const parts = [];
    if (event.artist) parts.push(`<span class="artist-name">${event.artist}</span>`);
    if (event.place) parts.push(event.place);
    if (event.address) parts.push(event.address);
    if (event.time) parts.push(event.time);
    const info = parts.length ? ', ' + parts.join(', ') : '';
    return `<p class="event-line"><a href="event-detail.html?id=${event.id}">${event.title}</a>${info}</p>`;
  }).join('');
  list.innerHTML = html;
}
renderEvents();
