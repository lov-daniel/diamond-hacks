import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

const extensionOrigin = 'chrome-extension://ofiocihddbaeinfpmmhcknlclnhnelcm';

dotenv.config();

const app = express();


// Route imports
import promptRoutes from './routes/prompt.js';

app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	exposedHeaders: ['Authorization'],
	credentials: true
  }));

app.use(express.json());

app.use('/prompt', promptRoutes);

let port = process.env.PORT || 4000;

app.listen(port,
	() => console.log(`Server listening on port ${port}`)
);
