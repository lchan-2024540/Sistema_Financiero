import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { verificarConexionBD } from './config/db';

const PORT = process.env.PORT || 3000;

async function iniciar(): Promise<void> {
  try {
    await verificarConexionBD();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos. Revisa tu archivo .env:', error);
    process.exit(1);
  }
}

iniciar();
