import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World from the backend!' });
});

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
