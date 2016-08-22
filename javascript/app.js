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
	this.select3DFile = function(){
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
		this.selected3DFile = fileElem3D.files[0].name
		loadGeometry();
	}
	else
	{
		this.selected3DFile = 'None'
	}
	this.view = 'anchored'
	this.x = -10
	this.y = 0
	this.z = -3
	this.azimuth_deg=0
	this.elevation_deg=0
	
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
f1.add(control, 'select3DFile');
f1.add(control, 'selected3DFile').listen();
scaleController = f1.add(control, 'scale')
cameraController = f3.add(control, 'view',['anchored','embedded', 'chase']);
f3.add(control, 'x').min(-100).max(100)
f3.add(control, 'y').min(-100).max(100)
f3.add(control, 'z').min(-30).max(5)
f3.add(control, 'azimuth_deg')
f3.add(control, 'elevation_deg')

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
			camera= cameraChase
		}
	}
	
});
timeController.onChange(function(timeValue){
	t= timeValue;
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
	control.selected3DFile = files[0].name;
	loadGeometry();
}


function loadGeometry()
{
	// Load the collada file ('.dae' extension)
	loader.load( './static/' + fileElem3D.files[0].name, function ( collada ) {
		if (elem3D!=null)
		{
			scene.remove(elem3D)
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
		scene.add( elem3D );			
		oldElem3Dx = 0
		oldElem3Dy = 0
		oldElem3Dz = 0
		
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 75, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;

	} );
}


function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 75, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	//camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	camera.up = new THREE.Vector3( 0, 0, -1 );
	camera.position.set( -0,-5,-0);
	cameraIni = camera
	North = new THREE.Vector3( 1, 0, 0 );
	North.add(cameraIni.position)
	cameraIni.lookAt(North)
	

	
	
	//camera.rotation.order ='ZYX'
	//camera.rotation.z=45*Math.PI/180;

	scene = new THREE.Scene();
	//scene.rotation.x = 90*Math.PI/180;
	//scene.rotation.z = -90*Math.PI/180;
	
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
	xAxisBody = new THREE.Mesh( new THREE.CubeGeometry( 1,0.1,0.1 ), new THREE.MeshBasicMaterial({ color: 0xff0000}) );
	xAxisBody.position.x=0.5
	scene.add(xAxisBody)
	yAxisBody = new THREE.Mesh( new THREE.CubeGeometry( 0.1,1,0.1 ), new THREE.MeshBasicMaterial({ color: 0x00ff00}) );
	yAxisBody.position.y=0.5
	scene.add(yAxisBody)
	zAxisBody = new THREE.Mesh( new THREE.CubeGeometry( 0.1,0.1,1 ), new THREE.MeshBasicMaterial({ color: 0x0000ff}) );
	zAxisBody.position.z=0.5
	triedreBody =triedre.clone()
	scene.add(triedreBody)
	
	cameraEmbedded = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	cameraChase = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	cameraEmbedded.up = new THREE.Vector3( 0, 0, -1 );
	cameraChase.up = new THREE.Vector3( 0, 0, -1 );
	triedreBody.add( cameraEmbedded );
	if (control.view=='embedded')
	{
		camera = cameraEmbedded
	}
	if (control.view=='chase')
	{
		camera = cameraChase
	}
	
	var grid = new THREE.GridHelper(1000, 13);
	grid.rotation.x = -Math.PI/2
	scene.add(grid);
	
	waterSurface = new THREE.Mesh( new THREE.CubeGeometry( 10000,10000,0.1 ), new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity:0.7, transparent: true}) );
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

	renderer = new THREE.WebGLRenderer();
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
}

//




function animate() {

	var delta = clock.getDelta();

	requestAnimationFrame( animate );

	t += delta*control.speed;
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
	
	tau = 10;
	alpha =Math.exp(-delta/tau)
	stateFilter.x= (1-alpha)*(state.x) + alpha*stateFilter.x
	stateFilter.y= (1-alpha)*(state.y) + alpha*stateFilter.y
	stateFilter.z= (1-alpha)*(state.z) + alpha*stateFilter.z
	cameraChase.position.x = stateFilter.x+control.x
	cameraChase.position.y = stateFilter.y+control.y
	cameraChase.position.z = stateFilter.z+control.z
	embeddedBearing = Math.atan2(state.y-cameraChase.position.y,state.x-cameraChase.position.x)
	BearingDir = new THREE.Vector3( Math.cos(control.azimuth_deg*Math.PI/180+embeddedBearing)*Math.cos(control.elevation_deg*Math.PI/180), Math.sin(control.azimuth_deg*Math.PI/180+embeddedBearing)*Math.cos(control.elevation_deg*Math.PI/180), -Math.sin(control.elevation_deg*Math.PI/180)  );
	BearingDir.add(cameraChase.position)
	cameraChase.lookAt(BearingDir)
	
	BearingDir = new THREE.Vector3( Math.cos(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), Math.sin(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), -Math.sin(control.elevation_deg*Math.PI/180)  );
	cameraEmbedded.position.set(control.x/control.scale, control.y/control.scale, control.z/control.scale)
	BearingDir.add(cameraEmbedded.position)
	cameraEmbedded.lookAt(BearingDir)
	
	BearingDir = new THREE.Vector3( Math.cos(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), Math.sin(control.azimuth_deg*Math.PI/180)*Math.cos(control.elevation_deg*Math.PI/180), -Math.sin(control.elevation_deg*Math.PI/180)  );
	BearingDir.add(cameraIni.position)
	cameraIni.lookAt(BearingDir)
	cameraIni.position.x = control.x
	cameraIni.position.y = control.y
	cameraIni.position.z = control.z
	if (elem3D!=null)
	{
		elem3D.rotation.order = 'ZYX';
		// "Classical" roll, pitch, yaw euler angles
		elem3D.rotation = triedreBody.rotation
		elem3D.position = triedreBody.position
		//elem3D.quaternion.x = obj.q0
		//elem3D.quaternion.y = obj.q1
		//elem3D.quaternion.z = obj.q2
		//elem3D.quaternion.w = obj.q3
		elem3D.updateMatrix();
	}
		//cameraIni.lookAt(cube.position)
	render();
	update();
}
function update() {
		//controls.update();
		/*if (elem3D!=null)
		{
			camera.position.x = camera.position.x + elem3D.position.x-oldElem3Dx
			camera.position.y = camera.position.y + elem3D.position.y-oldElem3Dy
			camera.position.z = camera.position.z + elem3D.position.z-oldElem3Dz
			oldElem3Dx = elem3D.position.x
			oldElem3Dy = elem3D.position.y
			oldElem3Dz = elem3D.position.z
		}*/
		//camera.position = elem3D.position
		//camera.lookAt(elem3D.position)
		stats.update();
}

function render() {
	renderer.render( scene, camera );
}


