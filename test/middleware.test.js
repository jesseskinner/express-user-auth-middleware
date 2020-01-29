import { expect } from 'chai';
import express from 'express';
import axios from 'axios';
import getDatabase from './_database.js';
import UserAuthMiddleware from '../src/middleware.js';

const email = 'abc@example.com';
const password = 'abc';

describe('middleware', () => {
	let database, server;

	beforeEach(async () => {
		database = await getDatabase();

		server = express()
			.use(
				new UserAuthMiddleware({
					database
				})
			)
			.listen();

		await database.query('TRUNCATE TABLE users');

		axios.defaults.baseURL = `http://0.0.0.0:${server.address().port}`;
	});

	afterEach(async () => {
		await database.end();
		server.close();
	});

	describe('/auth/signup', () => {
		it('should create a user', async () => {
			const res = await axios.post('/auth/signup', {
				email,
				password
			});

			expect(res.data).to.deep.equal({ success: true });
		});

		it('should fail if an email address is empty', async () => {
			const res = await axios.post('/auth/signup', {
				email: '',
				password
			});

			expect(res.data).to.deep.equal({
				error: 'Email and password are required'
			});
		});

		it('should fail if an email address already exists', async () => {
			await axios.post('/auth/signup', {
				email,
				password
			});

			const res = await axios.post('/auth/signup', {
				email,
				password
			});

			expect(res.data).to.deep.equal({
				error: 'Email address already exists'
			});
		});
	});

	describe('/auth/login', () => {
		it('should return success if the email and password matches', async () => {
			await axios.post('/auth/signup', {
				email,
				password
			});

			const res = await axios.post('/auth/login', {
				email,
				password
			});

			expect(res.data).to.deep.equal({ success: true });
		});

		it('should return an error if the password does not match', async () => {
			await axios.post('/auth/signup', {
				email,
				password
			});

			const { data } = await axios.post('/auth/login', {
				email,
				password: 'not the right one'
			});

			expect(data).to.deep.equal({ error: true });
		});

		it('should return an error if the email is unknown', async () => {
			const { data } = await axios.post('/auth/login', {
				email,
				password
			});

			expect(data).to.deep.equal({ error: true });
		});
	})
});
