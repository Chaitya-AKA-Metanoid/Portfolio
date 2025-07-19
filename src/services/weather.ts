// src/services/weather.ts
'use server';

import type { z } from 'genkit';

// Note: In a real app, you would use a more robust weather API with an API key.
// This is a free, no-key-required API for demonstration purposes.
const WEATHER_API_URL = 'https://goweather.herokuapp.com/weather/Mumbai';

export interface WeatherData {
    temperature: number; // in Celsius
    condition: string;
    wind: string;
}

export async function getMumbaiWeather(): Promise<WeatherData> {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(WEATHER_API_URL);
        if (!response.ok) {
            throw new Error(`Weather API failed with status: ${response.status}`);
        }
        const data = await response.json() as { temperature: string, description: string, wind: string };

        // Convert temperature string "30 °C" to a number
        const temperature = parseInt(data.temperature.split(' ')[0], 10);

        return {
            temperature: isNaN(temperature) ? 30 : temperature, // Default to 30 if parsing fails
            condition: data.description || 'Clear',
            wind: data.wind || '10 km/h'
        };
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        // Return default data on error
        return {
            temperature: 30,
            condition: 'Clear skies',
            wind: '10 km/h'
        };
    }
}
