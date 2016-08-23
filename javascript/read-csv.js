// Inspired from https://github.com/MounirMesselmeni/html-fileapi
var times = [];
var rolls = [];
var pitchs = [];
var yaws = [];
var xs = [];
var ys = [];
var zs = [];
function handleFiles(files) {
	// Check for the various File API support.
	if (window.FileReader) {
		// FileReader are supported.
		getAsText(files[0]);
	} else {
		alert('FileReader are not supported in this browser.');
	}
}

function getAsText(fileToRead) {
	var reader = new FileReader();
	// Handle errors load
	reader.onload = loadHandler;
	reader.onerror = errorHandler;
	// Read file into memory as UTF-8      
	reader.readAsText(fileToRead);
}

function loadHandler(event) {
	var csv = event.target.result;
	processData(csv);             
}

function processData(csv) {
    var allTextLines = csv.split(/\r\n|\n/);
    console.log(allTextLines.length);
    var lines = [];
    for (i=0;i<1;i++)
    {
      allTextLines.shift()
    }
    while (allTextLines.length) {
        lines.push(allTextLines.shift().split('	'));
    }
	drawOutput(lines);
}

function errorHandler(evt) {
	if(evt.target.error.name == "NotReadableError") {
		alert("Canno't read file !");
	}
}

function drawOutput(lines){
  
	times = [];
	rolls = [];
	pitchs = [];
	yaws = [];
	xs = [];
	ys = [];
	zs = [];
	//Clear previous data
	document.getElementById("output").innerHTML = "";
	var table = document.createElement("table");
	for (var i = 0; i < lines.length; i++) {
		i_t = 0;
		i_roll  = 1;
		i_pitch = 2;
		i_yaw   = 3;
		i_x		= 4;
		i_y   	= 5;
		i_z 	= 6;
		timei = parseFloat(lines[i][i_t]);
		rolli = parseFloat(lines[i][i_roll]);
		pitchi = parseFloat(lines[i][i_pitch]);
		yawi  = parseFloat(lines[i][i_yaw]);
		xi = parseFloat(lines[i][i_x]);
		yi = parseFloat(lines[i][i_y]);
		zi = parseFloat(lines[i][i_z]);
	
		if (false==isNaN(timei+rolli+pitchi+xi+yi+zi))
		{
			times[i] = timei
			rolls[i] = rolli
			pitchs[i]=pitchi
			yaws[i]=yawi
			xs[i]=xi
			ys[i]=yi
			zs[i]=zi
			var row = table.insertRow(-1);
			for (var j = 0; j < lines[i].length; j++) {
				var firstNameCell = row.insertCell(-1);
				firstNameCell.appendChild(document.createTextNode(lines[i][j]));
			}
		}
	}
	//document.getElementById("output").appendChild(table);
}
