const RaspiCam = require('raspicam');
const shortID = require('shortid').generate;

const camera = new RaspiCam({
	mode : 'video',
	output : `${__dirname}/video/${shortID()}`,
	timeout : 0,
	verbose : true,
	width : 1920,
	height : 1080
});

//to take a snapshot, start a timelapse or video recording
camera.start( );

//listen for the 'start' event triggered when the start method has been successfully initiated
camera.on('start', () => {
    console.log('Camera is recording...');
});

//listen for the 'read' event triggered when each new photo/video is saved
camera.on('read', function(err, timestamp, filename){ 
	if(err){
		console.error('An error occurred', err);
	} else {
		console.log('Video saved', timestamp, filename);
	}
});

//listen for the 'stop' event triggered when the stop method was called
camera.on('stop', function(){
    //do stuff
	console.log('Video recording was stopped');
});

//listen for the process to exit when the timeout has been reached
camera.on('exit', function(){
    //do stuff
	console.log('Timeout reached');
});

setTimeout( () => {
	camera.stop();
}, 15000 );
