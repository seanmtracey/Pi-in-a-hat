const auth = require('basic-auth');

module.exports = function(req, res, next){

	const credentials = auth(req);

	if (!credentials || credentials.name !== 'sean' || credentials.pass !== 'lolhatpassword') {
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="FT Partner"');
		res.end('Access denied');
		return false
	} else {
		next();
	}

}
