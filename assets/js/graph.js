const graph = document.getElementById('temperature-graph');
const heightOfText = -5;
const heightOfGraph = 0;

// data arrays
var hourlyTemp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var hourlyWind = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var hourlyUV = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var hourlyHumidity = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var dailyTemp = [0, 0, 0, 0, 0, 0];
var dailyWind = [0, 0, 0, 0, 0, 0];
var dailyUV = [0, 0, 0, 0, 0, 0];
var dailyHumidity = [0, 0, 0, 0, 0, 0];

init();

function init() {
	getData();
}

function getData() {
	fetch('https://api.openweathermap.org/data/2.5/onecall?lat=33.44&lon=-94.04&exclude=minutely,alerts,current&appid=19efebdbf2035141aa7986691561dc9f&units=metric&lang=en')
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
			console.log(`hourlyTemp = ${hourlyTemp}`);
			console.log(`hourlyWind = ${hourlyWind}`);
			console.log(`hourlyUV = ${hourlyUV}`);
			console.log(`hourlyHumidity = ${hourlyHumidity}`);
			console.log(`dailyTemp = ${dailyTemp}`);
			console.log(`dailyWind = ${dailyWind}`);
			console.log(`dailyUV = ${dailyUV}`);
			console.log(`dailyHumidity = ${dailyHumidity}`);
		})
		.then(() => {
			// variable for the namespace
			const svgns = 'http://www.w3.org/2000/svg';
			const svg1 = document.querySelector('#svg1');
			const svg2 = document.querySelector('#svg2');
			const svg3 = document.querySelector('#svg3');
			const svg4 = document.querySelector('#svg4');

			// TEMPERATURE GRAPH
			// TEXT
			for (var i = 0; i < 24; i++) {
				var textTemperatures = document.createElementNS(svgns, 'text');
				textTemperatures.setAttribute('fill', '#fff');
				textTemperatures.setAttribute('x', 20 * (i + 1));
				textTemperatures.setAttribute('y', 80 - 2 * hourlyTemp[i] + heightOfText);
				textTemperatures.textContent = hourlyTemp[i].toString();
				svg1.appendChild(textTemperatures);
			}
			// FILL
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - 2 * parseFloat(hourlyTemp[0]) + heightOfGraph}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - 2 * parseFloat(hourlyTemp[i]) + heightOfGraph}`);
			}
			drawString.push(`L 500 ${80 - 2 * parseFloat(hourlyTemp[23]) + heightOfGraph}`);
			drawString.push(`L 500 80`);
			drawString.push(`L 0 80`);
			drawString.push(` Z`); // close the path
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('fill', 'url(#temperatureGradient)');
			svg1.appendChild(path);
			// OUTLINE
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - 2 * parseFloat(hourlyTemp[0]) + heightOfGraph}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - 2 * parseFloat(hourlyTemp[i]) + heightOfGraph}`);
			}
			drawString.push(`L 500 ${80 - 2 * parseFloat(hourlyTemp[23]) + heightOfGraph}`);
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('stroke', '#fff');
			path.setAttribute('stroke-width', '2');
			path.setAttribute('fill', 'none');
			svg1.appendChild(path);

			// WIND GRAPH
			// TEXT
			for (var i = 0; i < 24; i++) {
				var textWind = document.createElementNS(svgns, 'text');
				textWind.setAttribute('fill', '#fff');
				textWind.setAttribute('x', 20 * (i + 1));
				textWind.setAttribute('y', 80 - 2 * hourlyWind[i] - 30);
				textWind.textContent = hourlyWind[i].toString();
				svg2.appendChild(textWind);
			}
			// FILL
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - 2 * parseFloat(hourlyWind[0]) - 20}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - 2 * parseFloat(hourlyWind[i]) - 20}`);
			}
			drawString.push(`L 500 ${80 - 2 * parseFloat(hourlyWind[23]) - 20}`);
			drawString.push(`L 500 80`);
			drawString.push(`L 0 80`);
			drawString.push(` Z`); // close the path
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('fill', 'url(#windGradient)');
			svg2.appendChild(path);
			// OUTLINE
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - 2 * parseFloat(hourlyWind[0]) - 20}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - 2 * parseFloat(hourlyWind[i]) - 20}`);
			}
			drawString.push(`L 500 ${80 - 2 * parseFloat(hourlyWind[23]) - 20}`);
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('stroke', '#fff');
			path.setAttribute('stroke-width', '2');
			path.setAttribute('fill', 'none');
			svg2.appendChild(path);

			// UV GRAPH
			// TEXT
			for (var i = 0; i < 24; i++) {
				var textUV = document.createElementNS(svgns, 'text');
				textUV.setAttribute('fill', '#fff');
				textUV.setAttribute('x', 20 * (i + 1));
				textUV.setAttribute('y', 80 - 2 * hourlyUV[i] - 40);
				textUV.textContent = hourlyUV[i].toString();
				svg3.appendChild(textUV);
			}
			// FILL
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - 2 * parseFloat(hourlyUV[0]) - 30}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - 2 * parseFloat(hourlyUV[i]) - 30}`);
			}
			drawString.push(`L 500 ${80 - 2 * parseFloat(hourlyUV[23]) - 30}`);
			drawString.push(`L 500 80`);
			drawString.push(`L 0 80`);
			drawString.push(` Z`); // close the path
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('fill', 'url(#humidityGradient)');
			svg3.appendChild(path);
			// OUTLINE
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - 2 * parseFloat(hourlyUV[0]) - 30}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - 2 * parseFloat(hourlyUV[i]) - 30}`);
			}
			drawString.push(`L 500 ${80 - 2 * parseFloat(hourlyUV[23]) - 30}`);
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('stroke', '#fff');
			path.setAttribute('stroke-width', '2');
			path.setAttribute('fill', 'none');
			svg3.appendChild(path);

			// HUMIDITY GRAPH
			// TEXT
			for (var i = 0; i < 24; i++) {
				var textHumidity = document.createElementNS(svgns, 'text');
				textHumidity.setAttribute('fill', '#fff');
				textHumidity.setAttribute('x', 20 * (i + 1));
				textHumidity.setAttribute('y', 80 - hourlyHumidity[i] + 30);
				textHumidity.textContent = hourlyHumidity[i].toString();
				svg4.appendChild(textHumidity);
			}
			// FILL
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - parseFloat(hourlyHumidity[0]) + 40}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - parseFloat(hourlyHumidity[i]) + 40}`);
			}
			drawString.push(`L 500 ${80 - parseFloat(hourlyHumidity[23]) + 40}`);
			drawString.push(`L 500 80`);
			drawString.push(`L 0 80`);
			drawString.push(` Z`); // close the path
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('fill', 'url(#humidityGradient)');
			svg4.appendChild(path);
			// OUTLINE
			var path = document.createElementNS(svgns, 'path');
			var drawString = [];
			drawString.push(` M 0 ${80 - parseFloat(hourlyHumidity[0]) + 40}`);
			for (var i = 0; i < 24; i++) {
				drawString.push(` L ${(i + 1) * 20} ${80 - parseFloat(hourlyHumidity[i]) + 40}`);
			}
			drawString.push(`L 500 ${80 - parseFloat(hourlyHumidity[23]) + 40}`);
			drawString = drawString.join(' ');
			path.setAttribute('d', drawString);
			path.setAttribute('stroke', '#fff');
			path.setAttribute('stroke-width', '2');
			path.setAttribute('fill', 'none');
			svg4.appendChild(path);
		});
}
