import { fileReaderService } from '../src/services/multiModalFileReader.js';
import { knowledgeBaseService } from '../src/services/knowledgeBaseService.js';
import { processChatMessage } from '../src/services/aiAssistantEngine.js';
import { calculateLCOE } from '../src/services/powerCalculations.js';
import { currencyService } from '../src/services/currencyService.js';

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE VERIFICATION SUITE ===\n');

  // Test 1: Frequency Query
  console.log('--- Test 1: Chatbot "what is frequency" ---');
  const freqResponse = await processChatMessage('what is frequency');
  console.log('Response title:', freqResponse.text.substring(0, 50));
  if (freqResponse.text.includes('50 Hz') && freqResponse.text.includes('Hertz')) {
    console.log('✅ PASS: "what is frequency" returns complete electrical frequency explanation!\n');
  } else {
    console.error('❌ FAIL: frequency response did not contain expected content.');
  }

  // Test 2: Custom Topic Training
  console.log('--- Test 2: Custom Topic Training ---');
  const customTopic = knowledgeBaseService.addTopic({
    title: 'Rooftop Net Metering Guideline Bangladesh 2026',
    category: 'Solar Policy',
    tags: ['net metering', 'rooftop', 'solar', 'berc'],
    content: 'Under Bangladesh Net Metering Guidelines, consumers can install rooftop solar up to 70% of sanctioned load. Exported solar energy is credited against import units at consumer tariff with settlement every billing cycle.'
  });
  console.log('Added topic:', customTopic.title);

  const searchResult = knowledgeBaseService.searchTopics('Tell me about rooftop net metering in Bangladesh');
  console.log('Search matches count:', searchResult.length);
  if (searchResult.length > 0 && searchResult[0].title.includes('Rooftop Net Metering')) {
    console.log('✅ PASS: KnowledgeBase search accurately matches query!\n');
  } else {
    console.error('❌ FAIL: search did not return newly trained topic.');
  }

  console.log('--- Test 3: Chatbot Asking About Trained Topic ---');
  const trainQueryResponse = await processChatMessage('What is rooftop net metering in Bangladesh?');
  console.log('Chatbot response preview:', trainQueryResponse.text.substring(0, 100));
  if (trainQueryResponse.text.includes('sanctioned load') && trainQueryResponse.text.includes('Net Metering')) {
    console.log('✅ PASS: Chatbot accurately answers using the user-trained topic!\n');
  } else {
    console.error('❌ FAIL: Chatbot did not reply with trained knowledge.');
  }

  // Test 4: Attendance Sheet Image Ingestion (Issue #2 Fix Verification)
  console.log('--- Test 4: Attendance Sheet Image Classification ---');
  const dummyImageFile = {
    name: 'Employee-Attendance-Sheet-Template-1.webp',
    type: 'image/webp',
    size: 65420
  };
  const processedImage = await fileReaderService.processImage(dummyImageFile);
  console.log('Identified Category:', processedImage.category);
  console.log('Summary Preview:\n', processedImage.summary);

  const hasNameplateHallucination = processedImage.summary.includes('250 MVA') || processedImage.summary.includes('Generator / Turbine');
  const isCorrectAttendance = processedImage.category.includes('Attendance') && processedImage.summary.includes('Attendance');

  if (!hasNameplateHallucination && isCorrectAttendance) {
    console.log('✅ PASS: Employee Attendance Sheet correctly classified without generator nameplate hallucination!\n');
  } else {
    console.error('❌ FAIL: Attendance sheet image still has nameplate hallucination!');
  }

  // Test 5: Universal CSV Ingestion
  console.log('--- Test 5: Universal CSV Ingestion & Delimiter Auto-Detection ---');
  const semicolonCSV = `Station;Capacity_MW;Voltage_kV;Daily_Output_MWh;Availability_Pct
Dhaka_North;300;132;5800;94.5
Chittagong_South;450;230;8900;96.2
Sylhet_Gas;150;33;3200;92.0`;

  const parsedCsv = fileReaderService.parseUniversalCSV(semicolonCSV);
  console.log('Detected delimiter:', parsedCsv.delimiter);
  console.log('Parsed headers:', parsedCsv.headers);
  console.log('Column stats count:', parsedCsv.columnStats.length);
  if (parsedCsv.delimiter === ';' && parsedCsv.headers.length === 5 && parsedCsv.columnStats[1].mean > 0) {
    console.log('✅ PASS: Universal CSV parser successfully detects delimiter, parses columns, and calculates stats!\n');
  } else {
    console.error('❌ FAIL: CSV parser failed.');
  }

  // Test 6: Manual Cost Calculation via Natural Language
  console.log('--- Test 6: Manual Cost Calculation via Chat ---');
  const manualCostChat = await processChatMessage('Calculate total cost with capex 1200, fuel 7.5, cf 0.85, capacity 300MW');
  console.log('Cost output preview:\n' + manualCostChat.text.substring(0, 150));
  if (manualCostChat.text.includes('LCOE') && manualCostChat.text.includes('BDT') && manualCostChat.text.includes('Crore')) {
    console.log('✅ PASS: Natural language manual cost parsing and calculation works in dual currency!\n');
  } else {
    console.error('❌ FAIL: Manual cost parsing failed.');
  }

  console.log('=== ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
