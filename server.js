import express from 'express';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import auth from './pages/api/auth';
app.use('/api/auth', auth);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use(limiter);

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});