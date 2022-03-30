// data arrays
var hourlyTemp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var hourlyWind = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var hourlyUV = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var hourlyHumidity = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var dailyTemp = [0, 0, 0, 0, 0, 0];
var dailyWind = [0, 0, 0, 0, 0, 0];
var dailyUV = [0, 0, 0, 0, 0, 0];
var dailyHumidity = [0, 0, 0, 0, 0, 0];

var option; // takes 4 values:option-temperature, option-wind, option-uv, option-humidity
var graphs;
var selectedGraph;

function init() {
	getData();
	addToggles();
	// update the weather icons
	// update the ball colors
	// update the dates
}

function updateWeatherIcons() {
	// if dangerous, 5 balls white
	// if not dangerous, 5 balls gray
	for (var i = 0; i < 6; i++) {
		// if(dailyTemp[i])
	}
}

function updateBallColors() {}

function updateDates() {}

// update graphs whenever window is resized
// var object = document.querySelector('.graph-container');
window.addEventListener('resize', () => {
	renderGraph();
});

function addToggles() {
	// get a node list of all options
	graphs = document.querySelectorAll('.graph-option');
	graphs.forEach((graph) => {
		graph.addEventListener('click', () => {
			graphs.forEach((g) => {
				g.classList.remove('active');
			});
			graph.classList.add('active');
			updateSelectedOption();
			renderGraph();
		});
	});
}

function getData() {
	fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts,current&appid=19efebdbf2035141aa7986691561dc9f&units=metric&lang=en`)
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			for (var i = 0; i < 24; i++) {
				hourlyTemp[i] = parseFloat(data.hourly[i].temp).toFixed(0);
				hourlyWind[i] = parseFloat(data.hourly[i].wind_speed).toFixed(0);
				hourlyUV[i] = parseFloat(data.hourly[i].uvi).toFixed(0);
				hourlyHumidity[i] = parseFloat(data.hourly[i].humidity).toFixed(0);
			}
			for (var i = 0; i < 6; i++) {
				// calculate average temperature out of morning, day, evening, night
				dailyTemp[i] = ((parseFloat(data.daily[i].temp.morn) + parseFloat(data.daily[i].temp.day) + parseFloat(data.daily[i].temp.eve) + parseFloat(data.daily[i].temp.night)) / 4).toFixed(0);
				dailyWind[i] = parseFloat(data.daily[i].wind_speed).toFixed(0);
				dailyUV[i] = parseFloat(data.daily[i].uvi).toFixed(0);
				dailyHumidity[i] = parseFloat(data.daily[i].humidity).toFixed(0);
			}

			updateSelectedOption();
			renderGraph();
		});
}

function updateSelectedOption() {
	// get a node list of all options
	graphs = document.querySelectorAll('.graph-option');

	// get the option with the active class
	var selectedGraph;
	graphs.forEach((graph) => {
		if (graph.matches('.active')) {
			selectedGraph = graph;
		}
	});

	option = selectedGraph.getAttribute('id');
}

function renderGraph() {
	var arr;
	if (option === 'option-temperature') {
		arr = hourlyTemp;
	} else if (option === 'option-wind') {
		arr = hourlyWind;
	} else if (option === 'option-uv') {
		arr = hourlyUV;
	} else if (option === 'option-humidity') {
		arr = hourlyHumidity;
	}

	// variable for the namespace
	const svgns = 'http://www.w3.org/2000/svg';
	var svg1 = document.querySelector('#svg1');
	while (svg1.children[1]) {
		svg1.removeChild(svg1.lastChild);
	}

	var parentContainer = document.querySelector('.graph-container');
	var svgWidth = parentContainer.clientWidth;
	var xIncrement = svgWidth / 25;
	svg1.setAttribute('width', svgWidth);

	var baseline = 12;
	var heightOfGraph = baseline + 5;
	var heightOfText = heightOfGraph + 5;

	var ymax = getMax(arr);
	var ymin = getMin(arr);
	const heightOfMaxLabel = 48;
	const heightOfMinLabel = 0;
	var svgHeight = 80;

	// GRAPH

	// labels
	var g = document.createElementNS(svgns, 'g');
	g.setAttribute('text-anchor', 'middle');
	g.setAttribute('fill', '#fff');
	var increment = 1;
	var startLabel = 0;
	if (svgWidth < 968) {
		startLabel = 1;
		increment = 2;
	}
	if (svgWidth < 576) {
		startLabel = 2;
		increment = 4;
	}
	for (var i = startLabel; i < 24; i += increment) {
		var label = document.createElementNS(svgns, 'text');

		label.setAttribute('x', parseInt(xIncrement * (i + 1)));
		label.setAttribute('y', svgHeight - scale(+arr[i], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfText);
		label.textContent = `${arr[i].toString()}`;

		g.appendChild(label);
	}
	svg1.appendChild(g);

	// FILL
	var increment = 1;
	var startLabel = 0;
	if (svgWidth < 968) {
		startLabel = 1;
		increment = 2;
	}
	if (svgWidth < 576) {
		startLabel = 2;
		increment = 4;
	}
	var path = document.createElementNS(svgns, 'path');
	var drawString = [];
	drawString.push(` M 0 ${svgHeight - scale(+arr[0], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfGraph}`);
	for (var i = startLabel; i < 24; i += increment) {
		drawString.push(` L ${parseInt((i + 1) * xIncrement)} ${svgHeight - scale(+arr[i], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfGraph}`);
	}
	drawString.push(`L ${svgWidth - 1} ${svgHeight - scale(+arr[23], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfGraph}`);
	drawString.push(`L ${svgWidth - 1} ${svgHeight - baseline}`);
	drawString.push(`L 0 ${svgHeight - baseline}`);
	drawString.push(` Z`); // close the path
	drawString = drawString.join(' ');
	path.setAttribute('d', drawString);
	path.setAttribute('fill', 'url(#temperatureGradient)');
	svg1.appendChild(path);
	// OUTLINE
	var increment = 1;
	var startLabel = 0;
	if (svgWidth < 968) {
		startLabel = 1;
		increment = 2;
	}
	if (svgWidth < 576) {
		startLabel = 2;
		increment = 4;
	}
	var path = document.createElementNS(svgns, 'path');
	var drawString = [];
	drawString.push(` M 0 ${svgHeight - scale(+arr[0], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfGraph}`);
	for (var i = startLabel; i < 24; i += increment) {
		drawString.push(` L ${parseInt((i + 1) * xIncrement)} ${svgHeight - scale(+arr[i], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfGraph}`);
	}
	drawString.push(`L ${svgWidth} ${svgHeight - scale(+arr[23], ymin, ymax, heightOfMinLabel, heightOfMaxLabel) - heightOfGraph}`);
	drawString = drawString.join(' ');
	path.setAttribute('d', drawString);
	path.setAttribute('stroke', '#513d6e');
	path.setAttribute('stroke-width', '2');
	path.setAttribute('fill', 'none');
	svg1.appendChild(path);

	// x-axis
	var tickHeight = 2;
	var g = document.createElementNS(svgns, 'g');
	g.setAttribute('text-anchor', 'middle');
	g.setAttribute('fill', '#fff');

	var startTick = 0;
	var increment = 1;

	if (svgWidth < 968) {
		startTick = 1;
		increment = 2;
	}
	if (svgWidth < 576) {
		startTick = 2;
		increment = 4;
	}
	for (var i = startTick; i < 24; i += increment) {
		var tick = document.createElementNS(svgns, 'text');
		tick.setAttribute('x', parseInt(xIncrement * (i + 1)));
		tick.setAttribute('y', svgHeight - tickHeight - 2);
		tick.textContent = moment(i, 'h').format('h\na');
		g.appendChild(tick);
	}
	svg1.appendChild(g);
}

function getMax(arr) {
	var max = arr[0];
	for (var i = 0; i < arr.length; i++) {
		if (+arr[i] >= +max) {
			max = arr[i];
		}
	}
	return max;
}

function getMin(arr) {
	var min = arr[0];
	for (var i = 0; i < arr.length; i++) {
		if (+arr[i] <= +min) {
			min = arr[i];
		}
	}
	return min;
}

// map a range of numbers to another range of numbers
const scale = (num, in_min, in_max, out_min, out_max) => {
	return parseInt(((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min);
};
