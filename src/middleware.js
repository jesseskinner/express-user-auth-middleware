import express from 'express';
import { setOptions, createTable, createUser, verifyUser } from './auth.js';

import session from 'express-session';
import MySQLSessionStore from 'express-mysql-session';

const MySQLStore = MySQLSessionStore(session);

export default function UserAuthMiddleware(options) {
	setOptions(options);

	createTable();

	const app = express();

	app.use(
		session({
			key: 'sid',
			secret: options.secret,
			store: new MySQLStore({}, options.database),
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

	app.get('/auth/test', (req, res) => {
		console.log(req.session);
		res.json(!!req.session.user);
	});

	return app;
}
