import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
import workflowRoutes from './routes/workflows';
import recordingRoutes from './routes/recording';
import accountRoutes from './routes/account';
import paymentRoutes from './routes/payments';

app.use('/v1/workflows', workflowRoutes);
app.use('/v1/recording', recordingRoutes);
app.use('/v1/account', accountRoutes);
app.use('/v1/payments', paymentRoutes);

// Health check
app.get('/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Yansu API Server running on port ${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/v1/docs`);
});
