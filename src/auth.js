import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const EMAIL_EXISTS = 'Email address already exists';

let database;
let tableName = 'users';
let saltRounds = 10;

export function setOptions(o) {
	database = o.database || database;
	tableName = o.tableName || tableName;
	saltRounds = o.saltRounds || saltRounds;
}

export async function createTable() {
	return database.query(`
		CREATE TABLE IF NOT EXISTS \`${tableName}\` (
			id INT(11) AUTO_INCREMENT NOT NULL,
			email VARCHAR(255) NOT NULL,
			password CHAR(60) NOT NULL,
			token CHAR(60) NULL,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			PRIMARY KEY (id),
			UNIQUE (email)
		)
	`);
}

export async function createUser({ email, password }) {
	const [users] = await database.query(
		`
			SELECT id
			FROM \`${tableName}\`
			WHERE ?
		`,
		{ email }
	);

	if (users && users.length === 1) {
		throw new Error(EMAIL_EXISTS);
	}

	const res = await database.query(
		`
			INSERT INTO \`${tableName}\`
			SET ?
		`,
		{
			email,
			password: await bcrypt.hash(password, saltRounds)
		}
	);

	return res[0].insertId;
}

export async function verifyUser({ email, password }) {
	const [users] = await database.query(
		`
			SELECT id, password
			FROM \`${tableName}\`
			WHERE ?
		`,
		{ email }
	);

	if (!users || users.length !== 1) {
		return false;
	}

	if (await bcrypt.compare(password, users[0].password)) {
		return users[0].id;
	}

	return false;
}

export async function getResetToken(email) {
	const token = (await randomBytes(16)).toString('hex');

	await database.query(
		`
			UPDATE \`${tableName}\`
			SET ?
			WHERE ?
		`,
		[{ token: await bcrypt.hash(token, saltRounds) }, { email }]
	);

	return token;
}

export async function resetPassword(email, token, password) {
	const [[user]] = await database.query(
		`
			SELECT id, token
			FROM \`${tableName}\`
			WHERE ?
		`,
		{ email }
	);

	if (user && (await bcrypt.compare(token, user.token))) {
		await database.query(
			`
				UPDATE \`${tableName}\`
				SET ?
				WHERE ?
			`,
			[
				{ password: await bcrypt.hash(password, saltRounds) },
				{ id: user.id }
			]
		);

		return true;
	}

	return false;
}
