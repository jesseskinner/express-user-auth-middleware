function UserAuthMiddleware({ tableName = 'users', database }) {
    return { createTable, getUserById, signup };
    
    async function createTable() {
        database.query(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT(11) AUTO_INCREMENT NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id)
            )
        `)
    }

	async function getUserById(id) {
		const [users] = await database.query(
			`
                SELECT id, email
                FROM ${tableName}
                WHERE id = ?
            `,
			[id]
        );
        
        return users[0];
	}

	async function signup({ email, password }) {
		const res = await database.query(
			`
                INSERT INTO ${tableName}
                SET ?
            `,
			{
				email,
				password
			}
        );
        
		return res[0].insertId;
	}
}

export default UserAuthMiddleware;
