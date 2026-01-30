const { Pool } = require("pg");

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: Number(process.env.DB_PORT),
});

/**
 * Function to perform a query on the database.
 * 
 * @param text The SQL query text.
 * @param params Optional parameters for the SQL query.
 * @returns SQL query result.
 */
export async function query(text: string, params?: any[]) {
	return await pool.query(text, params);
}
