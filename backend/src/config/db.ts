import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Algunos proveedores de MySQL en la nube (Aiven, PlanetScale, etc.) exigen
 * conexión cifrada (SSL) y rechazan cualquier conexión que no la use.
 * Si existe DB_CA (el certificado de la autoridad certificadora que te da
 * el proveedor), lo usamos para la conexión SSL. Si no existe (por ejemplo,
 * en desarrollo local con un MySQL normal), nos conectamos sin SSL.
 */
const sslConfig = process.env.DB_CA
  ? { ca: process.env.DB_CA.replace(/\\n/g, '\n') }
  : undefined;

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
  ssl: sslConfig,
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
