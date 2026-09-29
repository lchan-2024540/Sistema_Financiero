import express, { Application } from 'express';
import cors from 'cors';
import clientesRoutes from './routes/clientesRoutes';
import cuentasRoutes from './routes/cuentasRoutes';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/manejadorErrores';

export const app: Application = express();

app.use(cors());
app.use(express.json());

// Ruta de salud, útil para verificar que la API está viva
app.get('/', (_req, res) => {
  res.json({ mensaje: 'API del Sistema Bancario Académico funcionando correctamente.' });
});

// Módulos implementados (Día 5). Los módulos de auth, depósitos, retiros,
// transferencias y movimientos se agregan en los Días 6 y 7.
app.use('/clientes', clientesRoutes);
app.use('/cuentas', cuentasRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);
