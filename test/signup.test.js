import { expect } from 'chai';
import mysql from 'mysql2/promise';
import UserAuthMiddleware from '../src/index.js';

describe('express-user-auth-middleware', () => {
	let auth, database;

	before(async () => {
		database = await mysql.createConnection({
			host: '127.0.0.1',
			user: 'root',
			database: 'test_express_user_auth_middleware'
		});

		auth = new UserAuthMiddleware({
			database
		});

		auth.createTable();
	});

	after(async () => {
		await database.end();
	});

	describe('signup', () => {
		it('should create a user with an email address and password', async () => {
			const email = 'abc@example.com';
			const password = 'abc';

			const id = await auth.signup({ email, password });
			const user = await auth.getUserById(id);

			expect(user.email).to.deep.equal(email);
			expect(user.password).to.be.undefined;
			expect(user.id).to.be.greaterThan(0);
		});
	});
});
