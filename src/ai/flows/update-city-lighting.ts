// src/ai/flows/update-city-lighting.ts
'use server';

/**
 * @fileOverview Dynamically updates the cityscape's lighting and weather conditions based on real-time weather in Mumbai.
 *
 * - updateCityLighting - A function to update the cityscape lighting based on Mumbai's current weather.
 * - UpdateCityLightingInput - The input type for the updateCityLighting function (empty object).
 * - UpdateCityLightingOutput - The return type for the updateCityLighting function (describes weather and lighting).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  condition: z.string().describe('A short description of the weather condition (e.g., sunny, cloudy, rainy).'),
  lightingDescription: z.string().describe('A detailed description of the current lighting conditions in Mumbai, including time of day and any special atmospheric effects.'),
});

const UpdateCityLightingOutputSchema = WeatherSchema.extend({
  updatedLightingConfig: z.string().describe('A JSON string representing the updated lighting configuration for the cityscape, optimized for the current weather conditions.'),
});

export type UpdateCityLightingOutput = z.infer<typeof UpdateCityLightingOutputSchema>;

const UpdateCityLightingInputSchema = z.object({});
export type UpdateCityLightingInput = z.infer<typeof UpdateCityLightingInputSchema>;

export async function updateCityLighting(input: UpdateCityLightingInput): Promise<UpdateCityLightingOutput> {
  return updateCityLightingFlow(input);
}

const getCurrentWeatherTool = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Retrieves the current weather conditions in Mumbai.',
    inputSchema: z.object({}),
    outputSchema: WeatherSchema,
  },
  async () => {
    // In a real application, this would call an external weather API.
    // For now, return hardcoded example data.
    return {
      temperature: 30,
      condition: 'Clear skies',
      lightingDescription: 'The sun is setting, casting a warm golden glow over the city. The sky is a gradient of orange and pink.',
    };
  }
);

const prompt = ai.definePrompt({
  name: 'updateCityLightingPrompt',
  tools: [getCurrentWeatherTool],
  input: {schema: UpdateCityLightingInputSchema},
  output: {schema: UpdateCityLightingOutputSchema},
  prompt: `You are responsible for dynamically adjusting the lighting of a virtual cityscape to reflect the real-time weather conditions in Mumbai.

  The city is rendered in 3D using Three.js, and the lighting should be updated to create an immersive and realistic experience.

  First, use the getCurrentWeather tool to obtain the current weather conditions in Mumbai.

  Based on the weather conditions, generate a detailed description of the lighting and an appropriate JSON lighting configuration.

  This JSON configuration will be used to update the Three.js scene.

  Output the current temperature, weather condition, lighting description, and the JSON lighting configuration.
  `,
});

const updateCityLightingFlow = ai.defineFlow(
  {
    name: 'updateCityLightingFlow',
    inputSchema: UpdateCityLightingInputSchema,
    outputSchema: UpdateCityLightingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
