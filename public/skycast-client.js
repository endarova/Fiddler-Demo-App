import { SKYCAST_BASE_URL, SKYCAST_API_KEY } from './config.js';

export async function getForecast(city) {
  const url = `${SKYCAST_BASE_URL}/v1/forecast?city=${encodeURIComponent(city)}&days=3&units=metric`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: SKYCAST_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Forecast request failed');
  }

  return response.json();
}
