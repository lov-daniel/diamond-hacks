import express from 'express';
import generate from '../utils/gemini.js';

const router = express.Router();

router.post('/questions', async (req, res) => {
  try {
    const input = req.body.prompt;
	console.log(`Trying to summarize ${input}`)
    const result = await generate(`create some practice problems and a corresponding answer key so that I can test my understanding of this material: ${input}`);
    res.json({ summary: result });
  } catch (error) {
    console.error('Error in /prompt:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/summary', async (req, res) => {
	try {
	  const input = req.body.prompt;
	  console.log(`Trying to summarize ${input}`)
	  const result = await generate(`summarize this text and explain it to me like i am 5: ${input}`);
	  res.json({ summary: result });
	} catch (error) {
	  console.error('Error in /prompt:', error);
	  res.status(500).json({ error: 'Internal Server Error' });
	}
  });

export default router;
