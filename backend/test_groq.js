import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: 'Test' }]
    });
    console.log('SUCCESS:', completion.choices[0].message.content);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
