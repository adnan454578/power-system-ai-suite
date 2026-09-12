import { llmService } from '../src/services/llmService.js';
import { processChatMessage } from '../src/services/aiAssistantEngine.js';

async function test() {
  console.log('Testing processChatMessage with dummy API key...');
  llmService.setApiKey('AIzaSyTestKey1234567890abcdef');
  console.log('hasApiKey():', llmService.hasApiKey());

  const start = Date.now();
  console.log('Calling processChatMessage("what is frequency")...');
  try {
    const res = await processChatMessage('what is frequency');
    console.log(`Finished in ${Date.now() - start} ms`);
    console.log('Response sender:', res.sender);
    console.log('Response preview:', res.text.substring(0, 150));
  } catch (err) {
    console.error('CRASHED in processChatMessage:', err);
  }
}
test();
