import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import clientesRoutes from './routes/clientesRoutes';
import cuentasRoutes from './routes/cuentasRoutes';
import { depositosRouter, retirosRouter } from './routes/operacionesRoutes';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/manejadorErrores';

export const app: Application = express();

app.use(cors());
app.use(express.json());

// Ruta de salud, útil para verificar que la API está viva
app.get('/', (_req, res) => {
  res.json({ mensaje: 'API del Sistema Bancario Académico funcionando correctamente.' });
});

// Módulos implementados: clientes y cuentas (Día 5); auth, depósitos y
// retiros (Día 6). Transferencias y movimientos se agregan en el Día 7.
app.use('/auth', authRoutes);
app.use('/clientes', clientesRoutes);
app.use('/cuentas', cuentasRoutes);
app.use('/depositos', depositosRouter);
app.use('/retiros', retirosRouter);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);
