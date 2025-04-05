import express from 'express';
import generate from '../utils/gemini.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const input = req.body.input;
    const result = await generate(input);
    res.json({ result });
  } catch (error) {
    console.error('Error in /prompt:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
	try {
	  const input = req.body.input;
	  const result = await generate(input);
	  res.json({ result });
	} catch (error) {
	  console.error('Error in /prompt:', error);
	  res.status(500).json({ error: 'Internal Server Error' });
	}
  });

export default router;
