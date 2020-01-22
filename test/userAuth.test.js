import { expect } from 'chai';
import mysql from 'mysql2/promise';
import UserAuth from '../src/userAuth.js';

describe('UserAuth', () => {
	let auth, database;

	const email = 'abc@example.com';
	const password = 'abc';

	beforeEach(async () => {
		database = await mysql.createConnection({
			host: '127.0.0.1',
			user: 'root',
			database: 'test_express_user_auth_middleware'
		});

		auth = new UserAuth({
			database
		});

		await auth.createTable();
	});

	afterEach(async () => {
		await database.query(`
			DROP TABLE users
		`);

		await database.end();
	});

	describe('createUser', () => {
		it('should create a user and return the new user id', async () => {
			const id = await auth.createUser({ email, password });

			expect(id).to.be.greaterThan(0);
		});
	});

	describe('getUserById', () => {
		it('get a newly created user from the database', async () => {
			const id = await auth.createUser({ email, password });
			const user = await auth.getUserById(id);

			expect(user.email).to.deep.equal(email);
			expect(user.password).to.be.undefined;
			expect(user.id).to.equal(id);
		});
	});

	describe('verifyUser', () => {
		it('should return true if the email and password matches', async () => {
			await auth.createUser({ email, password });
			const verified = await auth.verifyUser(email, password);

			expect(verified).to.be.true;
		});

		it('should return false if the password does not match', async () => {
			await auth.createUser({ email, password });
			const verified = await auth.verifyUser(email, 'not the right pw');

			expect(verified).to.be.false;
		});

		it('should return false if the email is unknown', async () => {
			await auth.createUser({ email, password });
			const verified = await auth.verifyUser('some@non.sense', password);

			expect(verified).to.be.false;
		});
	});
});
