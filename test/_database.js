import mysql from 'mysql2';

export default function() {
	return mysql.createConnection({
		host: '127.0.0.1',
		user: 'root',
		database: 'test_express_user_auth_middleware'
	}).promise();
}
