import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testModel(modelName) {
  try {
    const client = new GoogleGenAI();
    const res = await client.models.generateContent({
      model: modelName,
      contents: [{role: 'user', parts: [{text: 'hi'}]}]
    });
    console.log(modelName, 'SUCCESS:', res.text);
  } catch (err) {
    console.log(modelName, 'ERROR:', err.message);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-1.5-flash-8b');
  await testModel('gemini-1.5-pro');
  await testModel('gemini-2.0-flash-exp');
}
run();
