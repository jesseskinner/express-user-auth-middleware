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

		it('should fail if an email address is used twice', async () => {
			await auth.createUser({ email, password });

			let error;

			try {
				await auth.createUser({ email, password });
			}catch(e) {
				error = e;
			}

			expect(error.message).to.equal(auth.EMAIL_EXISTS)
		});
	});

	describe('getEmailById', () => {
		it('get a newly created user from the database', async () => {
			const id = await auth.createUser({ email, password });
			const userEmail = await auth.getEmailById(id);

			expect(userEmail).to.equal(email);
		});
	});

	describe('verifyUser', () => {
		it('should return user ID if the email and password matches', async () => {
			const id = await auth.createUser({ email, password });
			const verified = await auth.verifyUser(email, password);

			expect(verified).to.equal(id);
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
