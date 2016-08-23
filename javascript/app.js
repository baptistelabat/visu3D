console.log("This is a 3D visualizator");






var camera, scene, renderer, objects, controls;
var t	= 0
var clock = new THREE.Clock();
logFileElem = document.getElementById("csvFileInput");
fileElem3D = document.getElementById("daeFileInput");
var myOutput = document.getElementById("info")

if (logFileElem.files.length>0)
{
	handleFiles(logFileElem.files)
}
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;


var keyboard = new THREEx.KeyboardState();
var particleLight, pointLight, skin;
var elem3D, vectorAcc, vectorMag;
var loader = new THREE.ColladaLoader();

// Use Z up as a convention (not the default one)
loader.options.convertUpAxis = true;



var RigidBodyState = function() {
  this.roll_deg = 0;
  this.pitch_deg = 0;
  this.yaw_deg = 0;
  this.x = 0;
  this.y = 0;
  this.z = 0;
};
state = new RigidBodyState();
stateFilter = new RigidBodyState();

var gui = new dat.GUI({
                height : 5 * 32 - 1
                });
				
var MyControl = function(){
	this.speed=1
	this.time=0
	this.inputType = 'Log file'
	this.websocketAddress = 'ws://127.0.0.1/websocket'
	this.selectLogFile = function(){
		logFileElem = document.getElementById("csvFileInput");
		logFileElem.click();
	}
	this.select3DFileDAE = function(){
		fileElem3D = document.getElementById("daeFileInput");
		fileElem3D.click();
	}
	this.scale =1
	if (logFileElem.files.length>0)
	{
		this.selectedLogFile = logFileElem.files[0].name
	}
	else
	{
		this.selectedLogFile = 'None'
	}
	if (fileElem3D.files.length>0)
	{
		this.selected3DFileDAE = fileElem3D.files[0].name
	}
	else
	{
		this.selected3DFileDAE = 'None'
	}
	this.view = 'embedded'
	this.x = -25
	this.y = 0
	this.z = -5
	this.azimuth_deg=0
	this.elevation_deg=0
	this.chaseTimeConstant = 2;
	
};


var control = new MyControl();
var f1 = gui.addFolder('Input');
var f2 = gui.addFolder('Time control');
var f3 = gui.addFolder('View');

var timeController = f2.add(control, 'time').step(0.1).min(0.).max(10.).listen();
f2.add(control, 'speed').min(-20).max(20).step(0.2);

var typeController = f1.add(control, 'inputType',['Log file', 'Websocket']);
f1.add(control, 'websocketAddress');
f1.add(control, 'selectLogFile');
f1.add(control, 'selectedLogFile').listen();
f1.add(control, 'select3DFileDAE');
f1.add(control, 'selected3DFileDAE').listen();
scaleController = f1.add(control, 'scale')
cameraController = f3.add(control, 'view',['anchored','embedded', 'chase']);
f3.add(control, 'x').min(-100).max(100).listen()
f3.add(control, 'y').min(-100).max(100).listen()
f3.add(control, 'z').min(-30).max(5).listen()
f3.add(control, 'azimuth_deg').listen()
f3.add(control, 'elevation_deg').listen()
f3.add(control, 'chaseTimeConstant').min(1).max(20)

cameraController.onFinishChange(function(cam){
	if (cam=='anchored')
	{
		camera = cameraIni;
	}
	if (cam=='embedded')
	{
		if (elem3D==null)
		{
			control.view = 'anchored'
		}
		else
		{
			//control.view = 'embedded'
			camera= cameraEmbedded
		}
	}
	if (cam=='chase')
	{
		if (elem3D==null)
		{
			control.view = 'anchored'
		}
		else
		{
			//control.view = 'embedded'
			stateFilter.x = state.x
			stateFilter.y = state.y
			stateFilter.z = state.z
			camera= cameraChase
		}
	}
	
});
timeController.onChange(function(timeValue){
	t= timeValue;
	if (times.length>0)
	{
		timeController.max(times[times.length-1])
	}
})
scaleController.onChange(function(scale){
	if (elem3D!=null)
	{
		elem3D.scale.x = elem3D.scale.y = elem3D.scale.z = scale;
	}
})

typeController.onChange(function(value){
	if (value=='Websocket')
	{
		ws = new WebSocket(value);
		ws.onmessage = function(evt){
            var myOutput = document.getElementById("info");
                myOutput.innerHTML = evt.data;
		}
	}
	else
	{
		ws.close();
	}
})

function interpState(t){
	
	if (times.length >0){
		state.roll_deg = everpolate.linear(t, times, rolls);
		state.pitch_deg = everpolate.linear(t, times, pitchs);
		state.yaw_deg = everpolate.linear(t, times, yaws);
		state.x = everpolate.linear(t, times, xs);
		state.y = everpolate.linear(t, times, ys);
		state.z = everpolate.linear(t, times, zs);
	}
}

init();
animate();

function loadLogFiles(files)
{
	control.selectedLogFile = files[0].name;
	handleFiles(files);
}
function loadDAEFiles(files){
	control.selected3DFileDAE = files[0].name;
	loadGeometry();
}


function loadGeometry()
{
	// Load the collada file ('.dae' extension)
	loader.load( './static/' + fileElem3D.files[0].name, function ( collada ) {
		if (elem3D!=null)
		{
			triedreBody.remove(elem3D)
		}
		if (boat!=null)
		{
			triedreBody.remove(boat)
		}
		elem3D = collada.scene;
		
		// Depending on file the geometry is the first or the second children
		if (elem3D.children[0].children[0] == null)
		{
			elem3D_geom = elem3D.children[0].geometry;
		}
		else
		{
			elem3D_geom = elem3D.children[0].children[0].geometry;
		}
		skin = collada.skins[ 0 ];
		elem3D.scale.x = elem3D.scale.y = elem3D.scale.z = control.scale;
		// Add the COLLADA      
		triedreBody.add( elem3D );
	} );
}


function init() {
	
	scene = new THREE.Scene();
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 1, FAR = 1000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.up = new THREE.Vector3( 0, 0, -1 );
	cameraIni = camera
	North = new THREE.Vector3( 1, 0, 0 );
	North.add(cameraIni.position)
	cameraIni.lookAt(North)
	
	cameraEmbedded = cameraIni.clone()
	cameraEmbedded.up = new THREE.Vector3( 0, 0, -1 );
	cameraFrame = new THREE.Mesh( new THREE.CubeGeometry( 0.1,0.1,0.1 ), new THREE.MeshBasicMaterial({ color: 0x000000, transparent:true, opacity:0.}) );
	cameraFrame.add(cameraEmbedded)

	


	
	cameraChase = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	
	cameraChase.up = new THREE.Vector3( 0, 0, -1 );
	

	if (control.view=='embedded')
	{
		camera = cameraEmbedded
	}
	if (control.view=='chase')
	{
		camera = cameraChase
	}

		// Create world axis
	triedre = new THREE.Mesh( new THREE.CubeGeometry( 0.1,0.1,0.1 ), new THREE.MeshBasicMaterial({ color: 0x000000}) );
	xNorthAxisWorld = new THREE.Mesh( new THREE.CubeGeometry( 1,0.1,0.1 ), new THREE.MeshBasicMaterial({ color: 0xff0000}) );
	xNorthAxisWorld.position.x=0.5
	//scene.add(xNorthAxisWorld)
	yEastAxisWorld = new THREE.Mesh( new THREE.CubeGeometry( 0.1,1,0.1 ), new THREE.MeshBasicMaterial({ color: 0x00ff00}) );
	yEastAxisWorld.position.y=0.5
	//scene.add(yEastAxisWorld)
	zDownAxisWorld = new THREE.Mesh( new THREE.CubeGeometry( 0.1,0.1,1 ), new THREE.MeshBasicMaterial({ color: 0x0000ff}) );
	zDownAxisWorld.position.z=0.5
	triedre.add(xNorthAxisWorld)
	triedre.add(yEastAxisWorld)
	triedre.add(zDownAxisWorld)
	scene.add(triedre)
	
	// Create local axis
	triedreBody =triedre.clone()
	triedreBody.add( cameraFrame);
	scene.add(triedreBody)
	
	var grid = new THREE.GridHelper(13000, 2000);
	grid.rotation.x = -Math.PI/2
	scene.add(grid);
	
	waterSurface = new THREE.Mesh( new THREE.CubeGeometry( 100000,100000,0.1 ), new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity:0.7, transparent: true}) );
	waterSurface.position.z=0.06
	scene.add(waterSurface)
	

	particleLight = new THREE.Mesh( new THREE.SphereGeometry( 0.003, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe : true } ) );
	scene.add( particleLight );

	// Lights

	scene.add( new THREE.AmbientLight( 0xcccccc ) );

	var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xeeeeee );
	directionalLight.position.x = Math.random() - 0.5;
	directionalLight.position.y = Math.random() - 0.5;
	directionalLight.position.z = Math.random() - 0.5;
	directionalLight.position.normalize();
	scene.add( directionalLight );

	pointLight = new THREE.PointLight( 0xffffff, 4 );
	pointLight.position = particleLight.position;
	scene.add( pointLight );

	renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	//
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	elem3D = new THREE.Mesh( new THREE.CubeGeometry( 0.01,0.01,0.01), new THREE.MeshBasicMaterial({ color: 0x0000ff}) );
	createDefaultBoat()
	triedreBody.add(boat)
}

//

function createDefaultBoat()
{
	boat = new THREE.Mesh( new THREE.CubeGeometry( 0.1,0.1,0.1), new THREE.MeshBasicMaterial({ color: 0x0000ff}) );
	portHull = new THREE.Mesh( new THREE.CubeGeometry( 13,1,1.5), new THREE.MeshPhongMaterial({ color: 0x0000ff}) );
	portHull.position.z = -0.5
	MWP = new THREE.Mesh( new THREE.CubeGeometry( 13.2,1.1,0.01), new THREE.MeshPhongMaterial({ color: 0xffffff}) );
	MWP.position.z=0.5
	portHull.add(MWP)
	stbdHull = portHull.clone()
	portHull.position.y = -3.75
	stbdHull.position.y =  3.75
	wing = new THREE.Mesh( new THREE.CubeGeometry( 4,0.5,25), new THREE.MeshPhongMaterial({ color: 0xffffff}) );
	wing.position.z = -13.5
	wing.position.x = -1.5
	wing.rotation.z = 10*Math.PI/180
	foil = new THREE.Mesh( new THREE.CubeGeometry( 0.4,0.1,3), new THREE.MeshPhongMaterial({ color: 0x000000}) );
	tip = new THREE.Mesh( new THREE.CubeGeometry( 0.4,2,0.1), new THREE.MeshPhongMaterial({ color: 0x000000}) );
	knee = new THREE.Mesh( new THREE.CubeGeometry( 0.1,0.1,0.1), new THREE.MeshPhongMaterial({ color: 0x000000}) );
	tip.position.y=1
	knee.add(tip)
	foil.add(knee)
	knee.position.z =1.5
	knee.rotation.x=-14*Math.PI/180
	foil.position.z=0.9
	foil.position.y=-3.75
	foil.position.x=1
	trampo = new THREE.Mesh( new THREE.CubeGeometry( 8,7.5,0.01), new THREE.MeshPhongMaterial({ color: 0x000000, transparent:true, opacity:0.5}) );
	trampo.position.x=-2.5
	trampo.position.z=-0.75-0.5
	
	rudderPort = new THREE.Mesh( new THREE.CubeGeometry( 0.2,0.05,3), new THREE.MeshPhongMaterial({ color: 0x000000}) );
	elevator = new THREE.Mesh( new THREE.CubeGeometry( 0.2,1.3,0.05), new THREE.MeshPhongMaterial({ color: 0x000000}) );
	elevator.position.z=1.5
	rudderPort.add(elevator)
	rudderPort.position.z=0.7
	rudderPort.position.x=-6.5
	rudderStbd = rudderPort.clone()
	rudderPort.position.y = -3.75
	rudderStbd.position.y=3.75
	boat.add(portHull)
	boat.add(stbdHull)
	boat.add(wing)
	boat.add(foil)
	boat.add(trampo)
	boat.add(rudderPort)
	boat.add(rudderStbd)
	boat.position.z=-0.25
	elem3D.add(boat)
}



function animate() {
	
	var delta = clock.getDelta();

	requestAnimationFrame( animate );

	t += delta*control.speed;
	if (times.length>0)
	{
		t= Math.max(times[0], Math.min(t, times[times.length-1]))
	}
	control.time = t;

	if (control.inputType=='Log file')
	{
		interpState(t)
	}
	else
	{
		state = JSON.parse(myOutput.innerHTML);
	}
	triedreBody.rotation.order = 'ZYX';
	triedreBody.rotation.x = state.roll_deg*Math.PI/180;
	triedreBody.rotation.y = state.pitch_deg*Math.PI/180;
	triedreBody.rotation.z = state.yaw_deg*Math.PI/180;
	triedreBody.position.x = state.x
	triedreBody.position.y = state.y
	triedreBody.position.z = state.z
	triedreBody.updateMatrix();
	
	tau = Math.max(0.1,control.chaseTimeConstant);
	alpha =Math.exp(-delta/tau*control.speed)
	stateFilter.x= (1-alpha)*(state.x) + alpha*stateFilter.x
	stateFilter.y= (1-alpha)*(state.y) + alpha*stateFilter.y
	stateFilter.z= (1-alpha)*(state.z) + alpha*stateFilter.z
	if (isNaN(stateFilter.x)||isNaN(stateFilter.y)||isNaN(stateFilter.z))
	{
		stateFilter.x = state.x
		stateFilter.y = state.y
		stateFilter.z = state.z
	}
	cameraChase.position.x = stateFilter.x+control.x
	cameraChase.position.y = stateFilter.y+control.y
	cameraChase.position.z = stateFilter.z+control.z
	embeddedBearing = Math.atan2(state.y-cameraChase.position.y,state.x-cameraChase.position.x)
	BearingDir = new THREE.Vector3( Math.cos(control.azimuth_deg*Math.PI/180+embeddedBearing)*Math.cos(control.elevation_deg*Math.PI/180), Math.sin(control.azimuth_deg*Math.PI/180+embeddedBearing)*Math.cos(control.elevation_deg*Math.PI/180), -Math.sin(control.elevation_deg*Math.PI/180)  );
	BearingDir.add(cameraChase.position)
	cameraChase.lookAt(BearingDir)
	
	BearingDirEmbedded = new THREE.Vector3( Math.cos(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), Math.sin(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), -Math.sin(control.elevation_deg*Math.PI/180)  );
	cameraFrame.position.set(control.x, control.y, control.z)
	BearingDirEmbedded.add(cameraEmbedded.position)
	cameraEmbedded.lookAt(BearingDirEmbedded)//new THREE.Vector3(1,0,0))
	
	BearingDir = new THREE.Vector3( Math.cos(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), Math.sin(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), -Math.sin(control.elevation_deg*Math.PI/180)  );
	BearingDir.add(cameraIni.position)
	cameraIni.lookAt(BearingDir)
	cameraIni.position.x = control.x
	cameraIni.position.y = control.y
	cameraIni.position.z = control.z

	render();
	update();
}
function update() {
		//controls.update();
		stats.update();
}

function render() {
	renderer.render( scene, camera );
}

var screenW = window.innerWidth;
var screenH = window.innerHeight; /*SCREEN*/
var spdx = 0, spdy = 0, mouseLeftDown = false, mouseX=0, mouseY=0; /*MOUSE*/
var mouseCenterDown = false
var azimuth_deg=0, elevation_deg=0;
var  mouseLeftDownX=0, mouseLeftDownY=0, mouseCenterDownX=0, mouseCenterDownY=0
var z_cam=0, y_cam=0
renderer.domElement.addEventListener('mousemove', function(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;

	if (mouseLeftDown)
	{	
		control.azimuth_deg=azimuth_deg   - (mouseX-mouseLeftDownX)/screenW*75;
		control.elevation_deg=elevation_deg + (mouseY-mouseLeftDownY)/screenH*75;
	}
	if (mouseCenterDown)
	{	
		control.y=y_cam   - (mouseX-mouseCenterDownX)/screenW*30;
		control.z=z_cam - (mouseY-mouseCenterDownY)/screenH*20;
	}
}, false);
renderer.domElement.addEventListener("mousedown", function(event) {
	if (event.which==1)
	{
		mouseLeftDown = true
		mouseLeftDownX = event.pageX;
		mouseLeftDownY = event.pageY;
		azimuth_deg = control.azimuth_deg
		elevation_deg = control.elevation_deg
	}
	
	if (event.which==2)
	{
		mouseCenterDown = true
		mouseCenterDownX = event.pageX;
		mouseCenterDownY = event.pageY;
		z_cam = control.z
		y_cam = control.y
	}

	
	

}, false);
renderer.domElement.addEventListener("mouseup", function(event) {
	mouseX = event.pageX
	mouseY = event.pageY
	if (event.which==1)
	{
		mouseLeftDown = false
		control.azimuth_deg=azimuth_deg   - (mouseX-mouseLeftDownX)/screenW*75;
		control.elevation_deg=elevation_deg + (mouseY-mouseLeftDownY)/screenH*75;
	}
	if (event.which==2)
	{
		mouseCenterDown = false

		control.y=y_cam   - (mouseX-mouseCenterDownX)/screenW*30;
		control.z=z_cam   - (mouseY-mouseCenterDownY)/screenH*20;
	}

}, false);


