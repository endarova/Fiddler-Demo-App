import { getForecast } from './skycast-client.js';

const form = document.getElementById('trip-form');
const citySelect = document.getElementById('city');
const forecastEl = document.getElementById('forecast');

function render(html, className = '') {
  forecastEl.className = className;
  forecastEl.innerHTML = html;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  render('<span class="spinner"></span> Loading forecast…', 'muted');

  try {
    const data = await getForecast(citySelect.value);

    const days = data.forecast
      .map(
        (d) => `<li><strong>${escapeHtml(d.date)}</strong>
          <span>${escapeHtml(d.summary)}</span>
          <span>${escapeHtml(d.high)}° / ${escapeHtml(d.low)}°</span></li>`,
      )
      .join('');
    render(`<p>${escapeHtml(data.location.name)}, ${escapeHtml(data.location.country)}</p><ul class="days">${days}</ul>`, 'ok');
  } catch (err) {
    console.error('Failed to load forecast:', err.message);
    render('Something went wrong. Please try again later.', 'error');
  }
});
