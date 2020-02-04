import express from 'express';
import {
	setOptions,
	createTable,
	createUser,
	verifyUser,
	getResetToken,
	resetPassword
} from './auth.js';

import session from 'express-session';
import MySQLSessionStore from 'express-mysql-session';

const MySQLStore = MySQLSessionStore(session);

export default function UserAuthMiddleware({
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
			saveUninitialized: false
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
			res.json({ error: true });
		}
	});

	app.post('/auth/forgot', async (req, res) => {
		const { email } = req.body;
		const token = await getResetToken(email);

		emailPasswordReset(email, token);

		res.json({ success: true });
	});

	app.post('/auth/reset', async (req, res) => {
		const { email, token, password } = req.body;

		res.json({ success: await resetPassword(email, token, password) });
	});

	app.get('/auth/test', (req, res) => {
		res.json(!!req.session.user);
	});

	return app;
}
