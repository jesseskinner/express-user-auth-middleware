import test from 'ava';
import { query } from './_database.js';
import UserAuthMiddleware from '../src/index.js';

let auth;

test.before(() => {
	auth = new UserAuthMiddleware({
		query
	});
});

test('signup should create a user with an email address and password', async t => {
	const email = 'abc@example.com';
	const password = 'abc';

	const user = await auth.signup({ email, password });

	t.is(user.email, email);
	t.undefined(user.password);
	t.greaterThan(user.id, 0);
});
