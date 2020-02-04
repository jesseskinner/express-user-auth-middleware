const { expect } = require('chai');
const express = require('express');
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const getDatabase = require('./_database.js');
const UserAuthMiddleware = require('../src/middleware.js');

axiosCookieJarSupport(axios);

const email = 'abc@example.com';
const password = 'abc';

describe('middleware', () => {
	let database, server, resetCallback;

	beforeEach(async () => {
		database = await getDatabase();

		await database.query('DROP TABLE IF EXISTS users');
		await database.query('DROP TABLE IF EXISTS sessions');

		server = express()
			.use(
				UserAuthMiddleware({
					database,
					secret: 'SECRET',
					clearExpired: false,
					emailPasswordReset: (to, resetCode) => {
						resetCallback(to, resetCode);
					}
				})
			)
			.listen();

		axios.defaults.baseURL = `http://0.0.0.0:${server.address().port}`;
		axios.defaults.withCredentials = true;
	});

	afterEach(async () => {
		await database.end();
		server.close();
		resetCallback = null;
	});

	describe('/auth/signup', () => {
		it('should create a user', async () => {
			const jar = new tough.CookieJar();

			const res = await axios.post(
				'/auth/signup',
				{
					email,
					password
				},
				{
					jar
				}
			);

			expect(res.headers['set-cookie']).to.not.be.undefined;
			expect(res.data).to.deep.equal({ success: true });

			// double check user is logged in
			const resDoubleCheck = await axios.get('/auth/test', { jar });
			expect(resDoubleCheck.data).to.be.true;
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
			const jar = new tough.CookieJar();

			await axios.post(
				'/auth/signup',
				{
					email,
					password
				},
				{ jar }
			);

			const res = await axios.post('/auth/login', {
				email,
				password
			});

			expect(res.headers['set-cookie']).to.not.be.undefined;
			expect(res.data).to.deep.equal({ success: true });

			// double check user is logged in
			const resDoubleCheck = await axios.get('/auth/test', {
				jar
			});
			expect(resDoubleCheck.data).to.be.true;
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

			expect(data).to.deep.equal({
				error: 'Incorrect email or password.'
			});
		});

		it('should return an error if the email is unknown', async () => {
			const { data } = await axios.post('/auth/login', {
				email,
				password
			});

			expect(data).to.deep.equal({
				error: 'Incorrect email or password.'
			});
		});
	});

	describe('/auth/reset & /auth/forgot', () => {
		it('should send an email with a reset code', async () => {
			let to, resetCode;

			await axios.post('/auth/signup', {
				email,
				password
			});

			resetCallback = (_to, _resetCode) => {
				to = _to;
				resetCode = _resetCode;
			};

			await axios.post('/auth/forgot', {
				email
			});

			expect(to).to.equal(email);
			expect(resetCode).to.be.a('string');
			expect(resetCode.length).to.equal(32);
		});

		it('should change the password with a valid token', async () => {
			let resetCode;

			await axios.post('/auth/signup', {
				email,
				password
			});

			resetCallback = (_to, _resetCode) => {
				resetCode = _resetCode;
			};

			await axios.post('/auth/forgot', {
				email
			});

			const resetRes = await axios.post('/auth/reset', {
				email,
				token: resetCode,
				password: 'new password'
			});

			const loginRes = await axios.post('/auth/login', {
				email,
				password: 'new password'
			});

			expect(resetRes.data).to.deep.equal({ success: true });
			expect(loginRes.data).to.deep.equal({ success: true });
		});

		it('should return an error if email is unknown', async () => {
			const res = await axios.post('/auth/forgot', {
				email: 'not@a.real.one'
			});

			expect(res.data).to.deep.equal({
				error: 'Email address not found.'
			});
		});
	});

	describe('/auth/logout', () => {
		it('should clear the session', async () => {
			const jar = new tough.CookieJar();

			await axios.post(
				'/auth/signup',
				{
					email,
					password
				},
				{
					jar
				}
			);

			await axios.post(
				'/auth/logout',
				{},
				{
					jar
				}
			);

			const res = await axios.get(
				'/auth/test',
				{},
				{
					jar
				}
			);

			expect(res.data).to.be.false;
		});
	});
});
