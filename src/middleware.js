const express = require('express');
const {
	setOptions,
	createTable,
	createUser,
	verifyUser,
	getResetToken,
	resetPassword
} = require('./auth.js');

const session = require('express-session');
const MySQLSessionStore = require('express-mysql-session');

const MySQLStore = MySQLSessionStore(session);

module.exports = function UserAuthMiddleware({
	database,
	tableName,
	saltRounds,
	secret,
	clearExpired = true,
	emailPasswordReset
}) {
	setOptions({ database, tableName, saltRounds });

	createTable();

	const app = express();

	app.use(
		session({
			key: 'sid',
			secret: secret,
			store: new MySQLStore({ clearExpired }, database),
			resave: false,
			saveUninitialized: false,
			unset: 'destroy',
			cookie: { secure: process.env.NODE_ENV === 'production' }
		}),
		express.json()
	);

	app.post('/auth/signup', async (req, res, next) => {
		if (!req.body.email || !req.body.password) {
			return res.json({ error: 'Email and password are required' });
		}

		const { email, password } = req.body;

		try {
			const id = await createUser({
				email,
				password
			});

			req.session.user = { id, email };

			res.json({ success: true });
		} catch (e) {
			return res.json({ error: e.message });
		}
	});

	app.post('/auth/login', async (req, res, next) => {
		if (!req.body.email || !req.body.password) {
			return res.json({ error: 'Email and password are required' });
		}

		const { email, password } = req.body;

		const id = await verifyUser({
			email,
			password
		});

		if (id) {
			req.session.user = { id, email };
			res.json({ success: true });
		} else {
			res.json({ error: 'Incorrect email or password.' });
		}
	});

	app.post('/auth/forgot', async (req, res) => {
		const { email } = req.body;
		const token = await getResetToken(email);

		if (!token) {
			return res.json({ error: 'Email address not found.' });
		}

		emailPasswordReset(email, token);

		res.json({ success: true });
	});

	app.post('/auth/reset', async (req, res) => {
		const { email, token, password } = req.body;

		if (await resetPassword(email, token, password)) {
			res.json({ success: true });
		} else {
			res.json({ error: 'Invalid token or email address.' });
		}
	});

	app.post('/auth/logout', (req, res) => {
		req.session = null;
		res.end();
	});

	app.get('/auth/test', (req, res) => {
		res.json(!!req.session.user);
	});

	return app;
};
