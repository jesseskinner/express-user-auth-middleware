import bcrypt from 'bcrypt';

export default function UserAuth({ tableName = 'users', database, saltRounds = 10 }) {
	return { createTable, getUserById, createUser, verifyUser };

	async function createTable() {
		database.query(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT(11) AUTO_INCREMENT NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id)
            )
        `);
	}

	async function getUserById(id) {
		const [users] = await database.query(
			`
                SELECT id, email
                FROM ${tableName}
                WHERE ?
            `,
			{ id }
		);

		return users[0];
	}

	async function createUser({ email, password }) {
		const res = await database.query(
			`
                INSERT INTO ${tableName}
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
                FROM ${tableName}
                WHERE ?
            `,
			{ email }
        );
        
        if (!users || users.length === 0) {
            return false;
        }

        if (await bcrypt.compare(password, users[0].password)) {
            return true;
        }

        return false;
	}
}
