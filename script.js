let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentCity = null;

function getElements() {
  const homeSearch = document.getElementById("homeSearch");
  const homeSearchBtn = document.getElementById("homeSearchBtn");
  const currentLocation = document.getElementById("currentLocation");
  const temperatureUnit = document.getElementById("temperatureUnit");
  const weatherCondition = document.getElementById("weatherCondition");
  const highTemperature = document.getElementById("highTemperature");
  const lowTemperature = document.getElementById("lowTemperature");
  const windDetail = document.getElementById("wind");
  const humidityDetail = document.getElementById("humidity");
  const pressureDetail = document.getElementById("pressure");
  const visibilityDetail = document.getElementById("visibility");
  const temperature = document.getElementById("temperature");
  const weatherIcon = document.getElementById("weatherIcon");
  const forecastList = document.getElementById("forecastList");
  const mainBackground = document.getElementById("mainBg");
  const favoriteBtn = document.getElementById("favoriteBtn");
  const favoriteList = document.querySelector(".favorite-list");
  const emptyFavorites = document.querySelector(".empty-favorites");
  const citySearch = document.getElementById("citySearch");
  const citySearchBtn = document.getElementById("citySearchBtn");
  const cityList = document.querySelector(".city-list");
  const themeToggle = document.getElementById("themeToggle");
  const defaultCity = document.getElementById("defaultCity");

  return {
    homeSearch,
    homeSearchBtn,
    currentLocation,
    temperatureUnit,
    weatherCondition,
    highTemperature,
    lowTemperature,
    windDetail,
    humidityDetail,
    pressureDetail,
    visibilityDetail,
    temperature,
    weatherIcon,
    forecastList,
    mainBackground,
    favoriteBtn,
    favoriteList,
    emptyFavorites,
    citySearch,
    citySearchBtn,
    cityList,
    themeToggle,
    defaultCity,
  };
}

function loadDefaultCity(cityName, elements) {
  fetchGeoCodingApi(cityName, elements);
}

function loadDarkMode(elements) {
  const darkMode = localStorage.getItem("darkMode") === "true";

  elements.themeToggle.checked = darkMode;
  document.body.classList.toggle("dark", darkMode);
}

function appEvents(elements) {
  elements.homeSearchBtn.addEventListener("click", function () {
    const searchInput = elements.homeSearch.value;

    if (searchInput.trim() === "") {
      alert("The search input cannot be empty");
    } else {
      fetchGeoCodingApi(searchInput, elements);
    }
  });

  elements.homeSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      elements.homeSearchBtn.click();
    }
  });

  elements.citySearchBtn.addEventListener("click", function () {
    const searchInput = elements.citySearch.value;

    if (searchInput.trim() === "") {
      alert("The search input cannot be empty");
    } else {
      searchCities(searchInput, elements);
    }
  });

  elements.citySearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      elements.citySearchBtn.click();
    }
  });

  elements.citySearch.addEventListener("input", function () {
    if (elements.citySearch.value.trim() === "") {
      elements.cityList.innerHTML = "";
    }
  });

  elements.favoriteBtn.addEventListener("click", function () {
    if (!currentCity) {
      return;
    }

    const existingCity = favorites.find(
      (city) =>
        city.latitude === currentCity.latitude &&
        city.longitude === currentCity.longitude,
    );

    if (existingCity) {
      favorites = favorites.filter(
        (city) =>
          city.latitude !== currentCity.latitude ||
          city.longitude !== currentCity.longitude,
      );
    } else {
      favorites.push(currentCity);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));

    renderFavorites(elements);
    updateFavoriteButton(elements);
  });

  elements.themeToggle.addEventListener("change", function () {
    document.body.classList.toggle("dark", elements.themeToggle.checked);

    localStorage.setItem("darkMode", elements.themeToggle.checked);
  });

  elements.defaultCity.addEventListener("change", function () {
    const selectedCity = elements.defaultCity.value;

    localStorage.setItem("defaultCity", selectedCity);

    loadDefaultCity(selectedCity, elements);
  });
}

async function fetchGeoCodingApi(city, elements) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      alert("City not found");
      return;
    }

    const latitude = data.results[0].latitude;
    const longitude = data.results[0].longitude;
    const cityName = data.results[0].name;
    const countryName = data.results[0].country;
    const fullLocation = cityName + ", " + countryName;

    currentCity = {
      name: cityName,
      country: countryName,
      latitude: latitude,
      longitude: longitude,
    };

    fetchWeatherApi(latitude, longitude, elements, fullLocation);
  } catch (err) {
    console.log(err.message);
  }
}

function setupNavigation() {
  const links = document.querySelectorAll(".sidebar a");
  const views = document.querySelectorAll(".view");

  links.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      const targetId = link.getAttribute("href").substring(1);

      views.forEach((view) => {
        view.classList.remove("active");
      });

      const targetView = document.getElementById(targetId);

      if (targetView) {
        targetView.classList.add("active");
      }
    });
  });
}
async function fetchWeatherApi(latitude, longitude, elements, fullLocation) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,visibility,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`,
    );

    const data = await response.json();

    const currentTemperature = data.current.temperature_2m;
    const currentHumidity = data.current.relative_humidity_2m;
    const currentPressure = data.current.pressure_msl;
    const currentWind = data.current.wind_speed_10m;
    const currentVisibility = data.current.visibility;
    const highTemperature = data.daily.temperature_2m_max[0];
    const lowTemperature = data.daily.temperature_2m_min[0];
    const forecastDates = data.daily.time.slice(0, 5);
    const forecastMax = data.daily.temperature_2m_max.slice(0, 5);
    const forecastMin = data.daily.temperature_2m_min.slice(0, 5);
    const forecastWeatherCodes = data.daily.weather_code.slice(0, 5);

    const forecast = forecastDates.map((date, index) => {
      return {
        date: date,
        max: forecastMax[index],
        min: forecastMin[index],
        weatherCode: forecastWeatherCodes[index],
      };
    });

    elements.forecastList.innerHTML = "";

    forecast.forEach((day) => {
      const card = document.createElement("div");
      card.classList.add("forecast-card");

      const dayElement = document.createElement("span");
      dayElement.classList.add("forecast-day");

      dayElement.textContent = day.date;
      card.appendChild(dayElement);

      const icon = document.createElement("img");
      icon.src = getWeatherIcon(day.weatherCode);
      icon.alt = getWeatherCondition(day.weatherCode);

      card.appendChild(icon);

      const conditionElement = document.createElement("span");
      conditionElement.classList.add("forecast-condition");

      conditionElement.textContent = getWeatherCondition(day.weatherCode);

      card.appendChild(conditionElement);

      const tempElement = document.createElement("span");
      tempElement.classList.add("forecast-temp");
      tempElement.textContent = `${Math.round(day.max)}° / ${Math.round(day.min)}°`;

      card.appendChild(tempElement);
      elements.forecastList.appendChild(card);
    });

    elements.temperature.textContent = Math.round(currentTemperature);
    elements.humidityDetail.textContent = `${currentHumidity}%`;
    elements.pressureDetail.textContent = `${Math.round(currentPressure)} hPa`;
    elements.windDetail.textContent = `${currentWind} km/h`;
    elements.visibilityDetail.textContent = `${Math.round(currentVisibility / 1000)} km`;
    elements.highTemperature.textContent = `${Math.round(highTemperature)}°`;
    elements.lowTemperature.textContent = `${Math.round(lowTemperature)}°`;

    const weatherCode = data.current.weather_code;
    const condition = getWeatherCondition(weatherCode);

    elements.weatherCondition.textContent = condition;

    elements.weatherIcon.src = getWeatherIcon(weatherCode, data.current.is_day);

    const isDay = data.current.is_day;
    const background = getWeatherBackground(weatherCode, isDay);
    elements.mainBackground.style.backgroundImage = `url("${background}")`;

    elements.currentLocation.textContent = fullLocation;
    updateFavoriteButton(elements);
  } catch (err) {
    console.log(err.message);
  }
}

function getWeatherCondition(weatherCode) {
  switch (weatherCode) {
    case 0:
      return "Clear sky";

    case 1:
      return "Mainly clear";

    case 2:
      return "Partly cloudy";

    case 3:
      return "Overcast";

    case 45:
    case 48:
      return "Fog";

    case 51:
    case 53:
    case 55:
      return "Drizzle";

    case 56:
    case 57:
      return "Freezing drizzle";

    case 61:
    case 63:
    case 65:
      return "Rain";

    case 66:
    case 67:
      return "Freezing rain";

    case 71:
    case 73:
    case 75:
    case 77:
      return "Snow";

    case 80:
    case 81:
    case 82:
      return "Rain showers";

    case 85:
    case 86:
      return "Snow showers";

    case 95:
      return "Thunderstorm";

    case 96:
    case 99:
      return "Thunderstorm with hail";

    default:
      return "Unknown";
  }
}

function getWeatherIcon(weatherCode, isDay = 1) {
  switch (weatherCode) {
    case 0:
    case 1:
      return isDay === 1
        ? "img/icons/clear-day.svg"
        : "img/icons/clear-night.svg";

    case 2:
      return isDay === 1
        ? "img/icons/partly-cloudy-day.svg"
        : "img/icons/partly-cloudy-night.svg";

    case 3:
      return "img/icons/overcast.svg";

    case 45:
    case 48:
      return "img/icons/fog.svg";

    case 51:
    case 53:
    case 55:
      return "img/icons/drizzle.svg";

    case 56:
    case 57:
    case 66:
    case 67:
      return "img/icons/sleet.svg";

    case 61:
    case 63:
    case 80:
    case 81:
      return "img/icons/rain.svg";

    case 65:
    case 82:
      return "img/icons/extreme-rain.svg";

    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "img/icons/snow.svg";

    case 95:
      return "img/icons/thunderstorms.svg";

    case 96:
    case 99:
      return "img/icons/thunderstorms-rain.svg";

    default:
      return "img/icons/cloudy.svg";
  }
}

function getWeatherBackground(weatherCode, isDay) {
  switch (weatherCode) {
    case 0:
      if (isDay === 1) {
        return "img/Clear-Day.jpg";
      } else {
        return "img/Clear-night.jpg";
      }
    case 1:
    case 2:
    case 3:
      return "img/Cloudy.jpg";
    case 45:
    case 48:
      return "img/Fog.jpg";
    case 95:
    case 96:
    case 97:
    case 98:
    case 99:
      return "img/Thunderstorm.jpg";
  }

  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return "img/Rain.jpg";
  } else if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    weatherCode === 85 ||
    weatherCode === 86
  ) {
    return "img/Snow.jpg";
  }

  return "img/Cloudy.jpg";
}

function updateFavoriteButton(elements) {
  if (!currentCity) {
    return;
  }

  const isFavorite = favorites.some(
    (city) =>
      city.latitude === currentCity.latitude &&
      city.longitude === currentCity.longitude,
  );

  const icon = elements.favoriteBtn.querySelector("i");

  if (isFavorite) {
    icon.className = "fa-solid fa-star";
  } else {
    icon.className = "fa-regular fa-star";
  }
}

function createCityCard(city, elements) {
  const card = document.createElement("div");
  card.classList.add("city-card");

  const info = document.createElement("div");

  const cityName = document.createElement("h2");
  cityName.textContent = city.name;

  const countryName = document.createElement("span");
  countryName.textContent = city.country;

  info.appendChild(cityName);
  info.appendChild(countryName);

  const actions = document.createElement("div");

  const favoriteBtn = document.createElement("button");
  favoriteBtn.classList.add("favorite-btn");

  const isFavorite = favorites.some(
    (favorite) =>
      favorite.latitude === city.latitude &&
      favorite.longitude === city.longitude,
  );

  favoriteBtn.innerHTML = isFavorite
    ? `<i class="fa-solid fa-star"></i>`
    : `<i class="fa-regular fa-star"></i>`;

  favoriteBtn.addEventListener("click", function (event) {
    event.stopPropagation();

    const existingCity = favorites.find(
      (favorite) =>
        favorite.latitude === city.latitude &&
        favorite.longitude === city.longitude,
    );

    if (existingCity) {
      favorites = favorites.filter(
        (favorite) =>
          favorite.latitude !== city.latitude ||
          favorite.longitude !== city.longitude,
      );
    } else {
      favorites.push({
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
      });
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));

    const icon = favoriteBtn.querySelector("i");

    if (existingCity) {
      icon.className = "fa-regular fa-star";
    } else {
      icon.className = "fa-solid fa-star";
    }
    renderFavorites(elements);
    updateFavoriteButton(elements);
  });

  actions.appendChild(favoriteBtn);

  card.appendChild(info);
  card.appendChild(actions);

  card.addEventListener("click", function () {
    currentCity = {
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    };

    fetchWeatherApi(
      city.latitude,
      city.longitude,
      elements,
      `${city.name}, ${city.country}`,
    );

    showView("home");
  });

  elements.cityList.appendChild(card);
}

async function searchCities(city, elements) {
  if (city.trim() === "") {
    elements.cityList.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`,
    );

    const data = await response.json();

    elements.cityList.innerHTML = "";

    if (!data.results) {
      elements.cityList.innerHTML = "<p>No cities found.</p>";
      return;
    }

    data.results.forEach((city) => {
      createCityCard(city, elements);
    });
  } catch (err) {
    console.log(err.message);
  }
}

function showView(viewId) {
  const views = document.querySelectorAll(".view");

  views.forEach((view) => {
    view.classList.remove("active");
  });

  const targetView = document.getElementById(viewId);

  if (targetView) {
    targetView.classList.add("active");
  }
}

function renderFavorites(elements) {
  elements.favoriteList.innerHTML = "";

  if (favorites.length === 0) {
    elements.emptyFavorites.style.display = "flex";
    return;
  }

  elements.emptyFavorites.style.display = "none";

  favorites.forEach((city) => {
    const card = document.createElement("div");
    card.classList.add("favorite-card");

    const info = document.createElement("div");

    const cityName = document.createElement("h2");
    cityName.textContent = city.name;

    const countryName = document.createElement("span");
    countryName.textContent = city.country;

    info.appendChild(cityName);
    info.appendChild(countryName);

    info.addEventListener("click", function () {
      currentCity = city;

      fetchWeatherApi(
        city.latitude,
        city.longitude,
        elements,
        `${city.name}, ${city.country}`,
      );

      showView("home");
    });

    const removeBtn = document.createElement("button");
    removeBtn.classList.add("favorite-btn");
    removeBtn.innerHTML = `<i class="fa-solid fa-star"></i>`;

    removeBtn.addEventListener("click", function (event) {
      event.stopPropagation();

      favorites = favorites.filter(
        (favorite) =>
          favorite.latitude !== city.latitude ||
          favorite.longitude !== city.longitude,
      );

      localStorage.setItem("favorites", JSON.stringify(favorites));

      renderFavorites(elements);
      updateFavoriteButton(elements);
    });

    card.appendChild(info);
    card.appendChild(removeBtn);

    elements.favoriteList.appendChild(card);
  });
}

const elements = getElements();

appEvents(elements);
renderFavorites(elements);
setupNavigation();

loadDarkMode(elements);

const savedCity = localStorage.getItem("defaultCity");

if (savedCity) {
  elements.defaultCity.value = savedCity;
  loadDefaultCity(savedCity, elements);
} else {
  loadDefaultCity(elements.defaultCity.value, elements);
}
