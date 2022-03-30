const buttonEl = document.getElementById('searchBtn');
const inputEl = document.getElementById('search');
var query;
var citynames = [];
var lats = [];
var lons = [];
var cityname;
var lat;
var lon;
var cityLogs;

const options = [document.getElementById('match1'), document.getElementById('match2'), document.getElementById('match3'), document.getElementById('match4'), document.getElementById('match5')];
const selectEl = document.getElementById('cityMatch');
const historyEl = document.getElementById('history');
const histories = [document.getElementById('history1'), document.getElementById('history2'), document.getElementById('history3'), document.getElementById('history4'), document.getElementById('history5')];
const cityNameLabelEl = document.getElementById('cityNameLabel');

selectEl.addEventListener('change', updateCity);
historyEl.addEventListener('change', updateCityFromHistory);

renderCurrentHistory(); // run this on page load
renderCurrentCity();
init();

function renderCurrentHistory() {
	cityLogs = localStorage.getItem('cityLogs');
	cityLogs = JSON.parse(cityLogs);
	// console.log(`The current cityLogs is ${cityLogs[cityLogs.length - 1].name}`);

	if (cityLogs != null) {
		// render the last one that was uploaded
		lat = cityLogs[cityLogs.length - 1].lat;
		lon = cityLogs[cityLogs.length - 1].lon;
		cityname = cityLogs[cityLogs.length - 1].name;
		// console.log(`The last (lat,lon) is (${lat},${lon})`);

		for (var i = 0; i < cityLogs.length; i++) {
			// loop through array of city logs

			//render city logs in reverse order
			histories[i].textContent = cityLogs[i].name;
		}
	} else {
		// if empty, initialise with New York
		if (lat === undefined || lon === undefined) {
			cityname = 'New York';
			lat = 40.73061;
			lon = -73.935242;
		}
	}
}

function recordHistory() {
	cityLogs = localStorage.getItem('cityLogs');
	cityLogs === null ? (cityLogs = []) : (cityLogs = JSON.parse(cityLogs));
	// if more than 5 items, pop the last one
	if (cityLogs.length === 5) {
		cityLogs.shift();
	}
	cityLogs.push({ name: cityname, lat: lat, lon: lon });

	localStorage.setItem('cityLogs', JSON.stringify(cityLogs));
}

function updateCity(e) {
	var clicked = +e.target.value;
	// console.log(`Clicked Option ${clicked}`);
	cityname = citynames[clicked - 1];
	lat = lats[clicked - 1];
	lon = lats[clicked - 1];
	// console.log(`Selected city with lat = ${lat} and lon = ${lon}`);
	// put in local storage and render in history bar

	recordHistory();
	renderCurrentHistory();
	renderCurrentCity();
	init(); // draw graphs
}

function updateCityFromHistory(e) {
	console.log(`updateCityFromHistory()`);
	console.log(`I am here, I clicked ${e.target.value}`);
	var clicked = +e.target.value;
	// console.log(`Clicked Option ${clicked}`);
	cityname = cityLogs[clicked - 1].name;
	lat = cityLogs[clicked - 1].lat;
	lon = cityLogs[clicked - 1].lon;
	console.log(`cityname = ${cityname}, lat = ${lat}, lon = ${lon}`);
	// console.log(`Selected city with lat = ${lat} and lon = ${lon}`);
	// put in local storage and render in history bar

	// recordHistory(); don't record history
	// renderCurrentHistory();
	renderCurrentCity();
	init(); // draw graphs
}

function renderCurrentCity() {
	// console.log(`helloX`);
	cityNameLabelEl.innerHTML = `${cityname}`;
}

// user can search by either clicking the submit button (magnifying glass)
buttonEl.addEventListener('click', (e) => {
	e.preventDefault();
	performSearch();
});

// user can also search by typing enter button while inside the search field
document.querySelector('#search').addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		performSearch();
	}
});

function performSearch() {
	updateQuery();
	// clearSearchBox();
	highlightOptions();
	updateLatAndLon();
}

function highlightOptions() {}

function inputWarning(warning) {
	// flash red
	inputEl.classList.add('warning');
	var x = inputEl.value;
	inputEl.setAttribute('placeholder', `${warning}`);
	inputEl.value = `${warning}`;
	setTimeout(() => {
		inputEl.classList.remove('warning');
		inputEl.value = `${x}`;
		inputEl.setAttribute('placeholder', 'CITY');
	}, 500);
}

function inputFlash() {
	inputEl.classList.add('highlight');
}
function inputUnflash() {
	inputEl.classList.remove('highlight');
}
function inputBlur() {
	inputEl.classList.add('gray');
}
function inputUnlur() {
	inputEl.classList.remove('gray');
}

const searchEl = document.getElementById('cityMatch');
function searchFlash() {
	// green until an option is clicked
	searchEl.classList.add('highlight');
}
function searchUnflash() {
	searchEl.classList.remove('highlight');
}
function searchBlur() {
	searchEl.classList.add('gray');
}

function searchUnblur() {
	searchEl.classList.remove('gray');
}

function updateQuery(event) {
	query = inputEl.value;
}

function clearSearchBox() {
	inputEl.value = '';
}

function updateLatAndLon() {
	if (query.length === 0) {
		inputWarning('EMPTY');
	} else {
		fetch(geocodingAPI(query))
			.then((response) => {
				if (!response) {
					throw response;
				}
				return response.json();
			})
			.then((data) => {
				// query is valid
				inputBlur();
				searchFlash();

				for (var i = 0; i < 5; i++) {
					lats[i] = data[i].lat;
					lons[i] = data[i].lon;
					options[i].textContent = `${data[i].name}, ${data[i].state}, ${data[i].country}`;
					citynames[i] = data[i].name;
				}
			})
			.catch((response) => {
				// inputWarning('NO MATCH');
				// console.log(`XError: ${response}`);
			});
	}
}

function geocodingAPI(query) {
	return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=19efebdbf2035141aa7986691561dc9f&units=metric&lang=en`;
}
