const spawn = require('child_process').spawn;

let currentJob = undefined;

function startRecording(destination){

	const args = ['-D', 'plughw:1', '-f', 'cd', destination];

	currentJob = spawn(`arecord`, args);

}

function stopRecording(){

	if(currentJob !== undefined){
		currentJob.kill();
	}

}

function isRecording(){
	return currentJob !== undefined;
}

module.exports = {
	start : startRecording,
	stop : stopRecording,
	isRecording : checkIfRecordingIsHappening
}