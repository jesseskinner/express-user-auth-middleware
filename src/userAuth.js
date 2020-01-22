import bcrypt from 'bcrypt';

const EMAIL_EXISTS = 'Email address already exists';

export default function UserAuth({
	database,
	tableName = 'users',
	saltRounds = 10
}) {
	return { createTable, getEmailById, createUser, verifyUser, EMAIL_EXISTS };

	async function createTable() {
		database.query(`
            CREATE TABLE IF NOT EXISTS \`${tableName}\` (
                id INT(11) AUTO_INCREMENT NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id),
                UNIQUE (email)
            )
        `);
	}

	async function getEmailById(id) {
		const [users] = await database.query(
			`
                SELECT email
                FROM \`${tableName}\`
                WHERE ?
            `,
			{ id }
		);

		return users[0].email;
	}

	async function createUser({ email, password }) {
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

	async function verifyUser(email, password) {
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
}
