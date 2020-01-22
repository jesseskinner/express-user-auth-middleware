import mysql from 'mysql2/promise.js';

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root'
});

export const query = (id, data) => {
    return db.query(id, data);
};
