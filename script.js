 const cityInput = document.getElementById('city-input');
        const searchBtn = document.getElementById('search-btn');
        const locationBtn = document.getElementById('location-btn');
        const cityName = document.querySelector('.city-name');
        const dateElement = document.querySelector('.date');
        const weatherIcon = document.querySelector('.weather-icon i');
        const temperature = document.querySelector('.temperature');
        const weatherDescription = document.querySelector('.weather-description');
        const windSpeed = document.querySelector('.detail-item:nth-child(1) .detail-value');
        const humidity = document.querySelector('.detail-item:nth-child(2) .detail-value');
        const pressure = document.querySelector('.detail-item:nth-child(3) .detail-value');
        const visibility = document.querySelector('.detail-item:nth-child(4) .detail-value');
        const forecastItems = document.querySelectorAll('.forecast-item');
        const errorMessage = document.getElementById('error-message');
        const loading = document.querySelector('.loading');
        const weatherInfo = document.querySelector('.weather-info');
        const forecast = document.querySelector('.forecast');

        // API Key
        const API_KEY = '95e67d1058cea413ec7975b5bc2de136';
        
        // Event Listeners
        searchBtn.addEventListener('click', () => {
            const location = cityInput.value.trim();
            if (location) {
                getWeatherDataByLocation(location);
            }
        });
        
        cityInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const location = cityInput.value.trim();
                if (location) {
                    getWeatherDataByLocation(location);
                }
            }
        });
        
        locationBtn.addEventListener('click', () => {
            getCurrentLocation();
        });
        
        // Function to get current location
        function getCurrentLocation() {
            if (!navigator.geolocation) {
                showError('Geolocation is not supported by your browser');
                return;
            }
            
            loading.style.display = 'block';
            weatherInfo.style.display = 'none';
            forecast.style.display = 'none';
            errorMessage.style.display = 'none';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    getWeatherDataByCoords(latitude, longitude);
                },
                (error) => {
                    loading.style.display = 'none';
                    showError('Unable to retrieve your location. Please search manually.');
                    console.error('Geolocation error:', error);
                }
            );
        }
        
        // Function to get weather data by location name
        function getWeatherDataByLocation(location) {
            loading.style.display = 'block';
            weatherInfo.style.display = 'none';
            forecast.style.display = 'none';
            errorMessage.style.display = 'none';
            
            // Geocoding API to get coordinates from location name
            const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`;
            
            fetch(geocodeUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Location not found');
                    }
                    return response.json();
                })
                .then(geoData => {
                    if (geoData.length === 0) {
                        throw new Error('Location not found');
                    }
                    
                    const { lat, lon, name, country, state } = geoData[0];
                    const displayName = state ? `${name}, ${state}, ${country}` : `${name}, ${country}`;
                    
                    // Get weather data using coordinates
                    return Promise.all([
                        getWeatherDataByCoords(lat, lon, displayName),
                        getForecastData(lat, lon)
                    ]);
                })
                .catch(error => {
                    loading.style.display = 'none';
                    showError(error.message || 'Failed to fetch location data');
                });
        }
        
        // Function to get weather data by coordinates
        function getWeatherDataByCoords(lat, lon, displayName = null) {
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
            
            return fetch(currentWeatherUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Weather data not available');
                    }
                    return response.json();
                })
                .then(currentData => {
                    // Update current weather UI
                    updateCurrentWeather(currentData, displayName);
                    
                    // Get forecast data
                    return getForecastData(lat, lon);
                })
                .then(forecastData => {
                    // Update forecast UI
                    updateForecast(forecastData);
                    
                    // Show weather info and forecast, hide loading
                    weatherInfo.style.display = 'block';
                    forecast.style.display = 'flex';
                    loading.style.display = 'none';
                })
                .catch(error => {
                    loading.style.display = 'none';
                    showError(error.message || 'Failed to fetch weather data');
                });
        }
        
        // Function to get forecast data
        function getForecastData(lat, lon) {
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
            
            return fetch(forecastUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Forecast not available');
                    }
                    return response.json();
                });
        }
        
        // Function to update current weather UI
        function updateCurrentWeather(data, displayName = null) {
            const name = displayName || `${data.name}, ${data.sys.country}`;
            cityName.textContent = name;
            
            const currentDate = new Date();
            dateElement.textContent = formatDate(currentDate);
            
            const temp = Math.round(data.main.temp);
            temperature.innerHTML = `${temp}<span>°C</span>`;
            
            const description = data.weather[0].description;
            weatherDescription.textContent = description.charAt(0).toUpperCase() + description.slice(1);
            
            // Set weather icon based on condition
            setWeatherIcon(data.weather[0].id);
            
            windSpeed.textContent = `${data.wind.speed} km/h`;
            humidity.textContent = `${data.main.humidity}%`;
            pressure.textContent = `${data.main.pressure} hPa`;
            visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        }
        
        // Function to update forecast UI
        function updateForecast(data) {
            // Get forecast for next 5 days (every day at 12:00)
            const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
            
            forecastItems.forEach((item, index) => {
                if (dailyForecasts[index]) {
                    const forecastData = dailyForecasts[index];
                    const date = new Date(forecastData.dt * 1000);
                    const day = formatDay(date);
                    const temp = Math.round(forecastData.main.temp);
                    
                    item.querySelector('.forecast-day').textContent = day;
                    item.querySelector('.forecast-temp').textContent = `${temp}°C`;
                    
                    // Set forecast icon
                    const iconElement = item.querySelector('.forecast-icon i');
                    setForecastIcon(iconElement, forecastData.weather[0].id);
                }
            });
        }
        
        // Function to set weather icon based on condition code
        function setWeatherIcon(conditionCode) {
            let iconClass = 'fas fa-';
            
            if (conditionCode >= 200 && conditionCode < 300) {
                iconClass += 'bolt'; // Thunderstorm
            } else if (conditionCode >= 300 && conditionCode < 400) {
                iconClass += 'cloud-rain'; // Drizzle
            } else if (conditionCode >= 500 && conditionCode < 600) {
                iconClass += 'cloud-showers-heavy'; // Rain
            } else if (conditionCode >= 600 && conditionCode < 700) {
                iconClass += 'snowflake'; // Snow
            } else if (conditionCode >= 700 && conditionCode < 800) {
                iconClass += 'smog'; // Atmosphere
            } else if (conditionCode === 800) {
                iconClass += 'sun'; // Clear
            } else if (conditionCode > 800) {
                iconClass += 'cloud'; // Clouds
            }
            
            weatherIcon.className = iconClass;
        }
        
        // Function to set forecast icon
        function setForecastIcon(iconElement, conditionCode) {
            let iconClass = 'fas fa-';
            
            if (conditionCode >= 200 && conditionCode < 300) {
                iconClass += 'bolt'; // Thunderstorm
            } else if (conditionCode >= 300 && conditionCode < 400) {
                iconClass += 'cloud-rain'; // Drizzle
            } else if (conditionCode >= 500 && conditionCode < 600) {
                iconClass += 'cloud-showers-heavy'; // Rain
            } else if (conditionCode >= 600 && conditionCode < 700) {
                iconClass += 'snowflake'; // Snow
            } else if (conditionCode >= 700 && conditionCode < 800) {
                iconClass += 'smog'; // Atmosphere
            } else if (conditionCode === 800) {
                iconClass += 'sun'; // Clear
            } else if (conditionCode > 800) {
                iconClass += 'cloud'; // Clouds
            }
            
            iconElement.className = iconClass;
        }
        
        // Helper function to format date
        function formatDate(date) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
        
        // Helper function to format day for forecast
        function formatDay(date) {
            const options = { weekday: 'short' };
            return date.toLocaleDateString('en-US', options);
        }
        
        // Helper function to show error
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        
        // Initialize with a popular Indian city
        window.addEventListener('load', () => {
            getWeatherDataByLocation('Delhi');
        });