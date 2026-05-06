import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { setupApiRoutes } from './v1/routes/api-routes';
import globalErrorHandler from './common/middlewares/globalErrorHandler';
import notFound from './common/middlewares/notFound';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Grosery API', version: '1.0.0' });
});

setupApiRoutes(app);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
