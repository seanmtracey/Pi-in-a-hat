require('dotenv').config();
const RaspiCam = require('raspicam');
const shortid = require('shortid').generate;
const diskspace = require('diskspace');
var twilio = require('twilio');

const recordAudio = require('./bin/lib/record-audio');
const getNextVideoNumber = require('./bin/lib/video-order');
var basicAuth = require('./bin/lib/check-creds');
const localIP = require('./bin/lib/get-ip');

const express = require('express');
const app = express();

var twilioClient = new twilio.RestClient(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
 
app.use(basicAuth);
app.use(express.static('public'));
app.use(express.static('pictures'));

// Wrap camera output in MP4 container
// ffmpeg -i %f -c:v libx264 -c:a copy myvideo.mp4

// Record audio
// arecord -D plughw:1 -f cd ./name.wav

let camera = undefined;
const videoOutputDirectory = `${__dirname}/video`;
const audioOutputDirectory = `${__dirname}/audio`;
const picturesOutputDirectory = `${__dirname}/pictures`;

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

app.get('/snapshot', (req, res) => {

	if(camera === undefined){

		const imageID = shortid()

		camera = new RaspiCam({
			mode : 'photo',
			output : `${picturesOutputDirectory}/${imageID}.png`,
			timeout : 100,
			quality : 80,
			verbose : true,
			width : 1640,
			height : 1232,
			nopreview : true,
			encoding : 'png'
		});

		camera.on('start', () => {
			console.log('Camera is recording...');
		});

		camera.on("read", function(err, filename){ 
			console.log('Read event');
			camera.stop();
			camera = undefined;
		});

		camera.on("exited", function(err, filename){
			console.log('Exited');
			if(err){
				res.status(500);
				res.json(err);
			} else {
				res.json({
					status : 'ok',
					image : `/pictures/${imageID}.png`,
					filename
				});
			}

		});

		camera.start();

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

	console.log(localIP());

	twilioClient.messages.create({
		body: `I think my IP address is one of the following ${localIP().join(', ')}`,
		to: process.env.MY_NUMBER,  // Text this number
		from: process.env.MY_TWILIO_NUMBER // From a valid Twilio number
	}, function(err, message) {
		console.log(message.sid);
	});

});
