const RaspiCam = require('raspicam');
const shortID = require('shortid').generate;
const diskspace = require('diskspace');

const express = require('express');
const app = express();

app.use(express.static('public'))

// Wrap camera output in MP4 container
// ffmpeg -i %f -c:v libx264 -c:a copy myvideo.mp4

let camera = undefined;

app.get('/start', (req, res) => {

	if(camera === undefined){
		
		console.log(`'camera' is undefined. Assigning now...`);

		camera = new RaspiCam({
			mode : 'video',
			output : `${__dirname}/video/${shortID()}`,
			timeout : 0,
			verbose : true,
			width : 1920,
			height : 1080
		});

		//listen for the 'start' event triggered when the start method has been successfully initiated
		camera.on('start', () => {
			console.log('Camera is recording...');
			res.json({
				status : 'ok',
				message : 'camera started'
			});
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
			console.log('Video recording was stopped');
			if(camera){
				camera = undefined;
			}
		});

		//listen for the process to exit when the timeout has been reached
		camera.on('exit', function(){
			console.log('Timeout reached');
			if(camera){
				camera = undefined;
			}
		});

		camera.start();

	}
	
});

app.get('/stop', (req, res) => {

	if(camera !== undefined){
		camera.stop();
		res.end();
	} else {
		res.status(403);
		res.json({
			status : 'err',
			message : 'Camera has not been started'
		});
	}

});

app.get('/status', (req, res) => {

	diskspace.check('/', (err, result) => {
		if(err){
			res.status(500);
			res.json({
				status : 'err',
				err
			});
		} else {
			res.json({
				status : 'ok',
				data : result
			})
		}
	});

});	

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');


});
