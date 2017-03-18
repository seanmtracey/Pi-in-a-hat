const RaspiCam = require('raspicam');
const diskspace = require('diskspace');

const recordAudio = require('./bin/lib/record-audio');
const getNextVideoNumber = require('./bin/lib/video-order');
var basicAuth = require('./bin/lib/check-creds');

const express = require('express');
const app = express();

 
app.use(basicAuth);

app.use(express.static('public'))

// Wrap camera output in MP4 container
// ffmpeg -i %f -c:v libx264 -c:a copy myvideo.mp4

// Record audio
// arecord -D plughw:1 -f cd ./name.wav

let camera = undefined;
const videoOutputDirectory = `${__dirname}/video`;
const audioOutputDirectory = `${__dirname}/audio`;

app.get('/start', (req, res) => {

	if(camera === undefined){
		
		console.log(`'camera' is undefined. Assigning now...`);

		getNextVideoNumber(videoOutputDirectory)
			.then(v => {
				
				recordAudio.start(`${audioOutputDirectory}/${v}.wav`);

				camera = new RaspiCam({
					mode : 'video',
					output : `${videoOutputDirectory}/${v}`,
					timeout : 0,
					verbose : true,
					width : 1920,
					height : 1080,
					nopreview : true
				});

				camera.on('start', () => {
					console.log('Camera is recording...');
					res.json({
						status : 'ok',
						message : 'camera started'
					});
				});

				camera.on('read', function(err, timestamp, filename){ 
					if(err){
						console.error('An error occurred', err);
					} else {
						console.log('Video saved', timestamp, filename);
					}
				});

				camera.on('stop', function(){
					console.log('Video recording was stopped');
					recordAudio.stop();
					if(camera){
						camera = undefined;
					}
				});

				camera.on('exit', function(){
					console.log('Timeout reached');
					recordAudio.stop();
					if(camera){
						camera = undefined;
					}
				});

				camera.start();

			})
			.catch(err => {
				res.status(500);
				res.json({
					status : 'err',
					data : err
				});
			})
		;

	}
	
});

app.get('/stop', (req, res) => {

	if(camera !== undefined){
		camera.stop();
		res.json({
			status : 'ok',
			message : 'camera stopped'
		});
	} else {
		res.status(422);
		res.json({
			status : 'err',
			message : 'Camera has not been started'
		});
	}

});

app.get('/disk', (req, res) => {

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

app.get('/status', (req, res) => {

	if(camera !== undefined){
		res.json({
			status : 'ok',
			camera : 'recording'
		});
	} else {
		res.json({
			status : 'ok',
			camera : 'not-recording'
		});
	}

});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
