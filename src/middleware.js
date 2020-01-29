import express from 'express';
import { setOptions, createTable, createUser, verifyUser } from './auth.js';

export default function UserAuthMiddleware(options) {
	setOptions(options);

	createTable();

	const app = express();

	app.use(express.json());

	app.post('/auth/signup', async (req, res, next) => {
		if (!req.body.email || !req.body.password) {
			return res.json({ error: 'Email and password are required' });
		}

		const { email, password } = req.body;

		try {
			await createUser({
				email,
				password
			});

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
			// TODO - set session
			// session.user = { id, email };

			res.json({ success: true });
		} else {
			res.json({ error: true });
		}
	});

	return app;
}
