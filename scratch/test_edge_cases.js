import { processChatMessage } from '../src/services/aiAssistantEngine.js';
import { fileReaderService } from '../src/services/multiModalFileReader.js';

async function test() {
  console.log('Testing edge cases:');

  // Case 1: Empty string message with attached file
  console.log('1. Testing empty message with attached file...');
  const dummyFile = {
    fileName: 'Employee-Attendance-Sheet-Template-1.webp',
    fileType: 'Attendance & Roster Document',
    category: 'Attendance & Roster Document',
    summary: 'Summary of attendance sheet',
    previewUrl: 'data:image/webp;base64,123'
  };

  try {
    const res1 = await processChatMessage('', { attachedFile: dummyFile });
    console.log('Res 1 text length:', res1.text.length, 'preview:', res1.text.substring(0, 80));
    console.log('✅ PASS Case 1');
  } catch (e) {
    console.error('❌ FAIL Case 1:', e);
  }

  // Case 2: Undefined message
  console.log('\n2. Testing undefined message...');
  try {
    const res2 = await processChatMessage(undefined, {});
    console.log('Res 2 text length:', res2.text.length, 'preview:', res2.text.substring(0, 80));
    console.log('✅ PASS Case 2');
  } catch (e) {
    console.error('❌ FAIL Case 2:', e);
  }

  // Case 3: Simple greeting "hi"
  console.log('\n3. Testing simple greeting "hi"...');
  try {
    const res3 = await processChatMessage('hi', {});
    console.log('Res 3 text length:', res3.text.length, 'preview:', res3.text.substring(0, 80));
    console.log('✅ PASS Case 3');
  } catch (e) {
    console.error('❌ FAIL Case 3:', e);
  }
}

test();
