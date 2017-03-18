const fs = require('fs');

module.exports = function(directory){

	return new Promise( (resolve, reject) => {

		fs.readdir(directory, (err, files) => {

			if(err){
				reject(err);
			} else {

				if(files.length === 0){
					return 0;
				} else {

					let highestNumber = 0;

					files.forEach(file => {

						if(parseInt(file) > highestNumber){
							highestNumber = parseInt(file);
						}

					});

					return highestNumber + 1;

				}

			}
			
		})

	});

};