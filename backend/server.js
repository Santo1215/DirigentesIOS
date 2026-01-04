import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando');
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 API en http://localhost:${process.env.PORT}`);
});
