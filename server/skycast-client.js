import { httpGet } from './http.js';

const BASE_URL = process.env.SKYCAST_BASE_URL ?? 'http://localhost:4001';
const API_KEY = process.env.SKYCAST_API_KEY;

export async function getForecast(city) {
  const url = `${BASE_URL}/v1/forecast?city=${encodeURIComponent(city)}&days=3&units=metric`;

  const response = await httpGet(url, {
    headers: {
      Accept: 'application/json',
      Authorization: API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Forecast request failed');
  }

  return response.json();
}
