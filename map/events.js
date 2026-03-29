const stored = JSON.parse(localStorage.getItem('oups-events-v1') || '[]');
const list = document.getElementById('events-list');
function renderEvents() {
  if (!stored.length) {
    list.innerHTML = '<p>Aucun événement enregistré.</p>';
    return;
  }
  let html = stored.map((event, index) => {
    const parts = [];
    if (event.artist) parts.push(event.artist);
    if (event.place) parts.push(event.place);
    if (event.address) parts.push(event.address);
    if (event.time) parts.push(event.time);
    const info = parts.length ? ', ' + parts.join(', ') : '';
    return `<p class="event-line"><a href="event-detail.html?id=${index}">${event.title}</a>${info}</p>`;
  }).join('');
  list.innerHTML = html;
}
renderEvents();
