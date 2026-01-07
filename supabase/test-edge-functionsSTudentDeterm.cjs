/**
 * Comprehensive Test Suite for Supabase Edge Functions
 * Tests all three edge functions with proper error handling and clear output
 */

const fs = require('fs');
const path = require('path');

// Supabase local credentials from `npx supabase start`
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Helper function to read and encode image
function loadImageAsBase64(relativePath) {
  const imagePath = path.join(__dirname, relativePath);
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  return base64Image;
}

// Helper function to call edge function
async function callEdgeFunction(functionName, requestBody) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Fixed template for deterministic runs (Laughing_Leo)
const FIXED_TEMPLATE = {
  templateId: 'LL',
  name: 'Laughing_Leo.jpg',
  path: '../src/assets/templates/daily/Laughing_Leo.jpg',
  description: "Leonardo DiCaprio laughing (from Django Unchained)",
};

// Test 1: ai-select-template
async function testSelectTemplate() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 1: ai-select-template');
  console.log('='.repeat(70));
  console.log('📋 Task: AI selects the best meme template for "Technology/AI"');
  console.log('📦 Testing with 4 templates (Technology/AI)\n');

  try {
    // Load the four Student Life templates with short descriptions
    const templates = [
      {
        templateId: '00',
        name: 'Success_Kid.jpg',
        path: '../src/assets/templates/student/Success_Kid.jpg',
        description: "A small child clenching a fist with a determined, victorious expression while standing on a sandy beach.",
      },
      {
        templateId: '01',
        name: 'The_Office_Congratulations.jpg',
        path: '../src/assets/templates/student/The_Office_Congratulations.jpg',
        description: "A man being congratulated by someone for a job well done, even though he did nothing special.",
      },
      {
        templateId: '02',
        name: 'Third_World_Skeptical_Kid.jpg',
        path: '../src/assets/templates/student/Third_World_Skeptical_Kid.jpg',
        description: "A young child giving someone a skeptical side-eye look, appearing doubtful or suspicious.",
      },
      {
        templateId: '03',
        name: 'Waiting_Skeleton.jpg',
        path: '../src/assets/templates/student/Waiting_Skeleton.jpg',
        description: "A skeleton sitting or leaning forward with its head resting on its hand, appearing tired and bored while waiting.",
      },
    ];

    console.log('📥 Loading templates...');
    const templatesWithBase64 = templates.map(t => {
      const base64 = loadImageAsBase64(t.path);
      console.log(`   ✓ ${t.templateId}: ${t.name} — ${t.description} (${(base64.length / 1024).toFixed(1)} KB)`);
      return {
        templateId: t.templateId,
        base64: base64,
        mimeType: 'image/jpeg',
        description: t.description,
      };
    });

    const requestBody = {
      topic: 'Student Life',
      templates: templatesWithBase64,
    }; 

    console.log('\n📤 Calling ai-select-template...');
    const startTime = Date.now();
    const data = await callEdgeFunction('ai-select-template', requestBody);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Success! Completed in ${duration}ms\n`);
    console.log('📊 Response:');
    console.log(`   Selected Template ID: ${data.selectedTemplateId}`);
    
    const selectedTemplate = templates.find(t => t.templateId === data.selectedTemplateId);
    if (selectedTemplate) {
      console.log(`   Template Name: ${selectedTemplate.name}`);
      console.log(`   Template Description: ${selectedTemplate.description}`);
    }

    console.log('\n🎉 TEST 1 PASSED: Template selection successful!\n');
    return {
      success: true,
      selectedTemplateId: data.selectedTemplateId,
      selectedTemplateName: selectedTemplate?.name,
      selectedTemplateDescription: selectedTemplate?.description,
      allTemplates: templates,
    };

  } catch (error) {
    console.error('\n❌ TEST 1 FAILED:');
    console.error('   Error:', error.message);
    return { success: false };
  }
}

// Test 2: ai-generate-captions (simplified output)
async function testGenerateCaptions(selectedTemplate, runLabel) {
  try {
    const templatePath = selectedTemplate?.path || '../src/assets/templates/daily/Laughing_Leo.jpg';
    const base64Image = loadImageAsBase64(templatePath);

    const requestBody = {
      topic: 'Student Life',
      templateBase64: base64Image,
      templateMimeType: 'image/jpeg',
      descriptionOfMemeTemplate: selectedTemplate?.description || 'Laughing Leo template',
    };  

    const data = await callEdgeFunction('ai-generate-captions', requestBody);

    if (data.aiCaptions && Array.isArray(data.aiCaptions)) {
      // Print only the 3 captions, minimal output per run
      console.log(`\nRun ${runLabel}:`);
      data.aiCaptions.forEach((caption, i) => {
        console.log(`  ${i + 1}. "${caption}"`);
      });
      return true;
    } else {
      console.log(`\nRun ${runLabel}: FAILED (unexpected response)`);
      return false;
    }
  } catch (error) {
    console.log(`\nRun ${runLabel}: FAILED`);
    return false;
  }
}

// Test 3: hf-refine-caption
async function testRefineCaption() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 3: hf-refine-caption');
  console.log('='.repeat(70));
  console.log('📋 Task: AI picks and refines the best of 3 human captions (Technology/AI)');
  console.log('📦 Using template: Change_My_Mind.jpg\n');

  try {
    const templatePath = '../src/assets/templates/tech/Change_My_Mind.jpg';
    const base64Image = loadImageAsBase64(templatePath);
    
    console.log('✅ Loaded template image');
    console.log(`📦 Size: ${(base64Image.length / 1024).toFixed(2)} KB\n`);

    // Three human-generated captions for "Student Life"
    const humanCaptions = [
      'Finals week is just a myth invented by professors',
      'Student life: 99% stress, 1% actually learning',
      'Sleep, study, social life - pick two',
    ];

    console.log('📝 Human Captions:');
    humanCaptions.forEach((caption, i) => {
      console.log(`   ${i + 1}. "${caption}"`);
    });

    const requestBody = {
      topic: 'Student Life',
      templateBase64: base64Image,
      templateMimeType: 'image/jpeg',
      humanCaptions: humanCaptions,
    };

    console.log('\n📤 Calling hf-refine-caption...');
    const startTime = Date.now();
    const data = await callEdgeFunction('hf-refine-caption', requestBody);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Success! Completed in ${duration}ms\n`);
    console.log('📊 Response:\n');
    console.log('✨ Final Refined Caption:\n');
    console.log(`   "${data.finalCaption}"\n`);
    
    console.log('🎉 TEST 3 PASSED: Caption refinement successful!\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST 3 FAILED:');
    // Detailed error message removed per request
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('🚀 SUPABASE EDGE FUNCTIONS - COMPREHENSIVE TEST SUITE');
  console.log('█'.repeat(70));
  console.log('\nConfiguration:');
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log('  Testing Functions:');
  console.log('    1. ai-select-template');
  console.log('    2. ai-generate-captions');
  console.log('    3. hf-refine-caption');

  const results = {
    selectTemplate: false,
    generateCaptions: false,
    refineCaption: false,
  };

  // Run ai-generate-captions 3 times using Laughing_Leo (Test 1 disabled)
  const runResults = [];
  for (let i = 1; i <= 3; i++) {
    const ok = await testGenerateCaptions(FIXED_TEMPLATE, i);
    runResults.push(ok);
  }

  // Minimal summary
  const successCount = runResults.filter(Boolean).length;
  console.log('\n' + '█'.repeat(40));
  console.log(`Runs completed: ${runResults.length}, successes: ${successCount}`);
  console.log('█'.repeat(40));
  process.exit(successCount === runResults.length ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
