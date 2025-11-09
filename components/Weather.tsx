

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  AlertIcon,
  AlertCircleIcon,
  InfoIcon,
  HumidityIcon,
  UVIcon,
  WindIcon,
  WeatherSunIcon,
  WeatherCloudyIcon,
  WeatherRainIcon,
  WeatherPartlyCloudyIcon,
  WindArrowIcon,
} from './Icons';

interface WeatherProps {
    location: { lat: number, lon: number } | null;
}

interface WeatherAlert {
    level: 'high' | 'medium' | 'low';
    title: string;
    description: string;
}

const Weather: React.FC<WeatherProps> = ({ location }) => {
    const [weatherData, setWeatherData] = useState<any>(null);
    const [forecastData, setForecastData] = useState<any[] | null>(null);
    const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
    const [historicalData, setHistoricalData] = useState<any[] | null>(null);
    const [rainfallForecast, setRainfallForecast] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (location) {
            const fetchAndProcessData = async () => {
                if (!loading) setIsRefreshing(true);
                setError(null);
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                    const prompt = `You are a helpful weather and agriculture assistant. Provide the current weather, a 5-day forecast, a 7-day rainfall probability forecast, 2-3 actionable farm alerts, and historical weather for the past 7 days for latitude ${location.lat} and longitude ${location.lon}. Today is ${new Date().toDateString()}. The output must be in JSON format adhering to the provided schema. The forecast should contain exactly 5 days, with daily high (temp_max) and low (temp_min) temperatures in Celsius. The rainfall forecast should contain exactly 7 days, with each day having a 'date' in 'YYYY-MM-DD' format and a 'probability' as a number between 0 and 1. For the current weather and forecast, provide an OpenWeatherMap-like icon code (e.g., '01d', '10n') for the 'icon' property. The wind speed should be in meters/second and wind direction as a compass abbreviation (e.g., 'N', 'SW', 'ENE'). The alerts should be critical and actionable for a farmer, with a level of 'high', 'medium', or 'low'. The historical data should contain exactly 7 days, with the date in 'YYYY-MM-DD' format, average temperature in Celsius, and total precipitation in mm.`;
                    
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: prompt,
                        config: {
                          responseMimeType: "application/json",
                          responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                currentWeather: {
                                    type: Type.OBJECT,
                                    properties: {
                                        temp: { type: Type.NUMBER },
                                        feels_like: { type: Type.NUMBER },
                                        description: { type: Type.STRING },
                                        humidity: { type: Type.NUMBER },
                                        wind_speed: { type: Type.NUMBER },
                                        wind_direction: { type: Type.STRING },
                                        icon: { type: Type.STRING }
                                    },
                                    required: ["temp", "feels_like", "description", "humidity", "wind_speed", "wind_direction", "icon"]
                                },
                                forecast: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            dt: { type: Type.NUMBER },
                                            temp_max: { type: Type.NUMBER },
                                            temp_min: { type: Type.NUMBER },
                                            description: { type: Type.STRING },
                                            icon: { type: Type.STRING }
                                        },
                                        required: ["dt", "temp_max", "temp_min", "description", "icon"]
                                    }
                                },
                                rainfallForecast: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            date: { type: Type.STRING },
                                            probability: { type: Type.NUMBER }
                                        },
                                        required: ["date", "probability"]
                                    }
                                },
                                alerts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            level: { type: Type.STRING },
                                            title: { type: Type.STRING },
                                            description: { type: Type.STRING }
                                        },
                                        required: ["level", "title", "description"]
                                    }
                                },
                                historicalData: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            date: { type: Type.STRING },
                                            avg_temp: { type: Type.NUMBER },
                                            precipitation: { type: Type.NUMBER }
                                        },
                                        required: ["date", "avg_temp", "precipitation"]
                                    }
                                }
                            },
                            required: ["name", "currentWeather", "forecast", "rainfallForecast", "alerts", "historicalData"]
                          }
                        },
                      });
        
                    const parsed = JSON.parse(response.text);
                    if (parsed) {
                        setWeatherData({
                            name: parsed.name,
                            main: {
                                temp: parsed.currentWeather.temp,
                                feels_like: parsed.currentWeather.feels_like,
                                humidity: parsed.currentWeather.humidity,
                            },
                            wind: {
                                speed: parsed.currentWeather.wind_speed,
                                direction: parsed.currentWeather.wind_direction,
                            },
                            weather: [{
                                description: parsed.currentWeather.description,
                                icon: parsed.currentWeather.icon,
                            }]
                        });
                        setForecastData(parsed.forecast);
                        setAlerts(parsed.alerts);
                        setHistoricalData(parsed.historicalData);
                        setRainfallForecast(parsed.rainfallForecast);
                    } else {
                        throw new Error("Failed to parse weather data from AI response.");
                    }

                } catch (err: any) {
                    setError(err.message || "An error occurred while fetching AI-powered weather data.");
                    console.error(err);
                } finally {
                    setLoading(false);
                    setIsRefreshing(false);
                }
            };

            fetchAndProcessData();
            const intervalId = setInterval(fetchAndProcessData, 15 * 60 * 1000); // Refresh every 15 minutes

            return () => clearInterval(intervalId); // Cleanup interval on unmount
        } else {
             setLoading(false);
             if (!location) setError("Geolocation not available or permission denied.");
        }
    }, [location]);

    const getWeatherIcon = (iconCode: string) => {
        if (iconCode?.includes('01')) return WeatherSunIcon;
        if (iconCode?.includes('02') || iconCode?.includes('03') || iconCode?.includes('04')) return WeatherPartlyCloudyIcon;
        if (iconCode?.includes('09') || iconCode?.includes('10')) return WeatherRainIcon;
        return WeatherCloudyIcon;
    };

    const getAlertIcon = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high':
                return AlertIcon;
            case 'medium':
                return AlertCircleIcon;
            case 'low':
                return InfoIcon;
            default:
                return AlertIcon;
        }
    };

    const getWindDirectionRotation = (direction: string = 'N'): string => {
        const rotations: { [key: string]: string } = {
            'N': 'rotate-0', 'NNE': 'rotate-[22.5deg]', 'NE': 'rotate-45', 'ENE': 'rotate-[67.5deg]',
            'E': 'rotate-90', 'ESE': 'rotate-[112.5deg]', 'SE': 'rotate-135', 'SSE': 'rotate-[157.5deg]',
            'S': 'rotate-180', 'SSW': '-rotate-135', 'SW': '-rotate-135', 'WSW': '-rotate-[112.5deg]',
            'W': '-rotate-90', 'WNW': '-rotate-[67.5deg]', 'NW': '-rotate-45', 'NNW': '-rotate-[22.5deg]'
        };
        return rotations[direction.toUpperCase()] || 'rotate-0';
    };

    const getAlertStyles = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high':
                return {
                    bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500/50', iconColor: 'text-red-500',
                    titleColor: 'text-red-800 dark:text-red-200', descriptionColor: 'text-red-700 dark:text-red-300',
                };
            case 'medium':
                return {
                    bg: 'bg-yellow-100 dark:bg-yellow-800/20', border: 'border-yellow-500/50', iconColor: 'text-yellow-500',
                    titleColor: 'text-yellow-800 dark:text-yellow-200', descriptionColor: 'text-yellow-700 dark:text-yellow-300',
                };
            case 'low':
                 return {
                    bg: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-500/50', iconColor: 'text-blue-500',
                    titleColor: 'text-blue-800 dark:text-blue-200', descriptionColor: 'text-blue-700 dark:text-blue-300',
                };
            default: return { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-500/50', iconColor: 'text-gray-500',
                    titleColor: 'text-gray-800 dark:text-gray-200', descriptionColor: 'text-gray-700 dark:text-gray-300', };
        }
    };

    if (loading) {
        return <div className="text-center p-8">Fetching local weather data with AI...</div>;
    }

    if (error || !weatherData || !forecastData || !historicalData || !rainfallForecast) {
        return <div className="text-center p-8 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg"><strong>Error:</strong> {error || "Could not load weather data."}</div>;
    }

    const CurrentWeatherIcon = getWeatherIcon(weatherData.weather[0].icon);
    const maxPrecipitation = Math.max(...historicalData.map(d => d.precipitation), 1); // Avoid division by zero

    return (
        <div className="max-w-5xl mx-auto space-y-8">
             <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Active Alerts for {weatherData.name}</h3>
                    <span className={`text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300 ${isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
                        Refreshing...
                    </span>
                 </div>
                {alerts.length > 0 ? (
                    alerts.map((alert, index) => {
                        const styles = getAlertStyles(alert.level);
                        const AlertIconComponent = getAlertIcon(alert.level);
                        return (
                            <div key={index} className={`p-4 rounded-lg border flex items-start space-x-4 ${styles.bg} ${styles.border}`}>
                                <div className="flex-shrink-0 pt-1">
                                    <AlertIconComponent className={`h-6 w-6 ${styles.iconColor}`} />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${styles.titleColor}`}>{alert.title}</h4>
                                    <p className={`text-sm ${styles.descriptionColor}`}>{alert.description}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">No critical weather alerts at this time.</div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">Current Conditions</h4>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-5xl font-bold text-gray-900 dark:text-white">{Math.round(weatherData.main.temp)}°C</p>
                            <p className="text-gray-500 dark:text-gray-400 capitalize">{weatherData.weather[0].description}</p>
                        </div>
                        <CurrentWeatherIcon className="h-20 w-20 text-yellow-500" />
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center"><HumidityIcon className="h-4 w-4 mr-2" /> Humidity</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{weatherData.main.humidity}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center"><WindIcon className="h-4 w-4 mr-2" /> Wind</span>
                            <div className="flex items-center space-x-2">
                                <WindArrowIcon className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-500 ${getWindDirectionRotation(weatherData.wind.direction)}`} />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{Math.round(weatherData.wind.speed * 3.6)} km/h</span>
                                <span className="font-mono text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{weatherData.wind.direction}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-gray-500 dark:text-gray-400 flex items-center"><UVIcon className="h-4 w-4 mr-2" /> Feels Like</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{Math.round(weatherData.main.feels_like)}°C</span>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">5-Day Forecast</h4>
                    <div className="space-y-2">
                        {forecastData.map((day: any, index: number) => {
                            const DayIcon = getWeatherIcon(day.icon);
                            return (
                                <div key={day.dt} className={`flex items-center justify-between p-2 ${index < forecastData.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                                    <p className="font-semibold text-gray-700 dark:text-gray-300 w-16">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <div className="flex items-center gap-2">
                                        <DayIcon className="h-8 w-8 text-gray-500" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block capitalize w-24 truncate">{day.description}</span>
                                    </div>
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                        <span className="font-bold">{Math.round(day.temp_max)}°</span>
                                        <span className="text-gray-500 dark:text-gray-400"> / {Math.round(day.temp_min)}°</span>
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7-Day Rainfall Outlook</h3>
                <div className="space-y-4">
                    {rainfallForecast.map((day: any, index: number) => {
                        const probabilityPercent = Math.round(day.probability * 100);
                        return (
                            <div key={index} className="grid grid-cols-5 items-center gap-4 text-sm">
                                <p className="font-medium text-gray-700 dark:text-gray-300 col-span-2">
                                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                                </p>
                                <div className="col-span-2 flex items-center">
                                    <WeatherRainIcon className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5" role="presentation">
                                        <div 
                                            className="bg-blue-500 h-2.5 rounded-full" 
                                            style={{ width: `${probabilityPercent}%` }}
                                            aria-valuenow={probabilityPercent}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            role="progressbar"
                                            aria-label={`Rain probability: ${probabilityPercent}%`}
                                        ></div>
                                    </div>
                                </div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 col-span-1 text-right">
                                    {probabilityPercent}%
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Historical Weather (Past 7 Days)</h3>
                <div className="space-y-3">
                    {historicalData.map((day: any, index: number) => (
                        <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                           <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 w-full sm:w-48">
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <div className="flex items-center space-x-4 sm:space-x-6 text-sm w-full justify-start sm:justify-end">
                                <span className="flex items-center text-gray-600 dark:text-gray-400 w-36">
                                    <UVIcon className="h-5 w-5 mr-2 text-orange-500" />
                                    Avg Temp: <strong className="ml-1 text-gray-800 dark:text-gray-200">{day.avg_temp}°C</strong>
                                </span>
                                <div className="flex items-center text-gray-600 dark:text-gray-400 w-40 sm:w-48">
                                    <WeatherRainIcon className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-baseline">
                                            <span>Precip:</span>
                                            <strong className="text-gray-800 dark:text-gray-200">{day.precipitation.toFixed(1)} mm</strong>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1" role="presentation">
                                            <div 
                                                className="bg-blue-400 h-1.5 rounded-full" 
                                                style={{ width: `${(day.precipitation / maxPrecipitation) * 100}%` }}
                                                aria-valuenow={day.precipitation}
                                                aria-valuemin="0"
                                                aria-valuemax={maxPrecipitation}
                                                role="progressbar"
                                                aria-label={`Precipitation: ${day.precipitation.toFixed(1)}mm`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Weather;