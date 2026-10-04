import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Pool de conexiones a MySQL.
 * Usamos un pool (en vez de una sola conexión) para que la API pueda
 * atender varias peticiones al mismo tiempo sin bloquearse.
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_bancario',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

/**
 * Verifica que la conexión a la base de datos funcione.
 * Se llama una vez al iniciar el servidor (ver server.ts).
 */
export async function verificarConexionBD(): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.ping();
    console.log('Conexión a MySQL establecida correctamente.');
  } finally {
    conexion.release();
  }
}
