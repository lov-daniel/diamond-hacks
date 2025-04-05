import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

// Route imports
import promptRoutes from './routes/prompt.js';

app.use(express.json());
app.use('/prompt', promptRoutes);
let port = process.env.PORT || 4000;

app.listen(port,
	() => console.log(`Server listening on port ${port}`)
);
