
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  AlertIcon,
  HumidityIcon,
  UVIcon,
  WindIcon,
  WeatherSunIcon,
  WeatherCloudyIcon,
  WeatherRainIcon,
  WeatherPartlyCloudyIcon,
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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (location) {
            const fetchAndProcessData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                    const prompt = `You are a helpful weather and agriculture assistant. Provide the current weather, a 5-day forecast, a 7-day rainfall probability forecast, 2-3 actionable farm alerts, and historical weather for the past 7 days for latitude ${location.lat} and longitude ${location.lon}. Today is ${new Date().toDateString()}. The output must be in JSON format adhering to the provided schema. The forecast should contain exactly 5 days. The rainfall forecast should contain exactly 7 days, with each day having a 'date' in 'YYYY-MM-DD' format and a 'probability' as a number between 0 and 1. For the current weather and forecast, provide an OpenWeatherMap-like icon code (e.g., '01d', '10n') for the 'icon' property. The wind speed should be in meters/second. The alerts should be critical and actionable for a farmer. The historical data should contain exactly 7 days, with the date in 'YYYY-MM-DD' format, average temperature in Celsius, and total precipitation in mm.`;
                    
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
                                        icon: { type: Type.STRING }
                                    },
                                    required: ["temp", "feels_like", "description", "humidity", "wind_speed", "icon"]
                                },
                                forecast: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            dt: { type: Type.NUMBER },
                                            temp: { type: Type.NUMBER },
                                            description: { type: Type.STRING },
                                            icon: { type: Type.STRING }
                                        },
                                        required: ["dt", "temp", "description", "icon"]
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
                            },
                            weather: [{
                                description: parsed.currentWeather.description,
                                icon: parsed.currentWeather.icon,
                            }]
                        });
                        setForecastData(parsed.forecast.map((day: any) => ({
                            dt: day.dt,
                            main: { temp: day.temp },
                            weather: [{ description: day.description, icon: day.icon }]
                        })));
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
                }
            };
            fetchAndProcessData();
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

    return (
        <div className="max-w-5xl mx-auto space-y-8">
             <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Active Alerts for {weatherData.name}</h3>
                {alerts.length > 0 ? (
                    alerts.map((alert, index) => {
                        const styles = getAlertStyles(alert.level);
                        return (
                            <div key={index} className={`p-4 rounded-lg border flex items-start space-x-4 ${styles.bg} ${styles.border}`}>
                                <div className="flex-shrink-0 pt-1"><AlertIcon className={`h-6 w-6 ${styles.iconColor}`} /></div>
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
                            <span className="font-medium text-gray-700 dark:text-gray-300">{Math.round(weatherData.wind.speed * 3.6)} km/h</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-gray-500 dark:text-gray-400 flex items-center"><UVIcon className="h-4 w-4 mr-2" /> Feels Like</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{Math.round(weatherData.main.feels_like)}°C</span>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">5-Day Forecast</h4>
                    <div className="flex justify-around">
                        {forecastData.map((day: any) => {
                            const DayIcon = getWeatherIcon(day.weather[0].icon);
                            return (
                                <div key={day.dt} className="text-center flex-1">
                                    <p className="font-medium text-gray-600 dark:text-gray-300">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <DayIcon className="h-10 w-10 text-gray-500 mx-auto my-2" />
                                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{Math.round(day.main.temp)}°</p>
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
                            <div key={index} className="grid grid-cols-4 items-center gap-4 text-sm">
                                <p className="font-medium text-gray-700 dark:text-gray-300 col-span-1">
                                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Past 7-Day Trends</h3>
                <div className="space-y-3">
                    {historicalData.map((day: any, index: number) => (
                        <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                           <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
                                <span className="flex items-center text-gray-600 dark:text-gray-400">
                                    <UVIcon className="h-5 w-5 mr-2 text-orange-500" />
                                    Avg Temp: <strong className="ml-1 text-gray-800 dark:text-gray-200">{day.avg_temp}°C</strong>
                                </span>
                                <span className="flex items-center text-gray-600 dark:text-gray-400">
                                    <WeatherRainIcon className="h-5 w-5 mr-2 text-blue-500" />
                                    Precip: <strong className="ml-1 text-gray-800 dark:text-gray-200">{day.precipitation} mm</strong>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Weather;
