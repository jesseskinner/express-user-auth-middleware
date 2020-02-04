const mysql = require('mysql2');

module.exports = function() {
	return mysql
		.createConnection({
			host: '127.0.0.1',
			user: 'root',
			database: 'test_express_user_auth_middleware'
		})
		.promise();
};
