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

// --- Focused: Only hf-refine-caption tests and template listing ---

// --- All templates (12 total): Student Life, Technology/AI, Daily struggles ---
const TEMPLATES = {
  student: [
    {
      templateId: 'sl1',
      name: 'Success_Kid.jpg',
      path: '../src/assets/templates/student/Success_Kid.jpg',
      description: 'A small child clenching a fist with a determined, victorious expression while standing on a sandy beach.',
    },
    {
      templateId: 'sl2',
      name: 'The_Office_Congratulations.jpg',
      path: '../src/assets/templates/student/The_Office_Congratulations.jpg',
      description: 'A man being congratulated by someone for a job well done, even though he did nothing special.',
    },
    {
      templateId: 'sl3',
      name: 'Third_World_Skeptical_Kid.jpg',
      path: '../src/assets/templates/student/Third_World_Skeptical_Kid.jpg',
      description: 'A young child giving someone a skeptical side-eye look, appearing doubtful or suspicious.',
    },
    {
      templateId: 'sl4',
      name: 'Waiting_Skeleton.jpg',
      path: '../src/assets/templates/student/Waiting_Skeleton.jpg',
      description: 'A skeleton sitting or leaning forward with its head resting on its hand, appearing tired and bored while waiting.',
    },
  ],

  tech: [
    {
      templateId: 'ta1',
      name: 'Absolute_Cinema.jpg',
      path: '../src/assets/templates/tech/Absolute_Cinema.jpg',
      description: 'A man sitting in a movie theater seat, smiling with approval while watching a screen, with dramatic lighting.',
    },
    {
      templateId: 'ta2',
      name: 'Change_My_Mind.jpg',
      path: '../src/assets/templates/tech/Change_My_Mind.jpg',
      description: 'A man sitting at a table outdoors with a sign reading "Change My Mind", appearing ready to debate or challenge an opinion.',
    },
    {
      templateId: 'ta3',
      name: 'One_Does_Not_Simply.jpg',
      path: '../src/assets/templates/tech/One_Does_Not_Simply.jpg',
      description: 'A man with long hair and a serious expression gesturing with his hand while speaking emphatically.',
    },
    {
      templateId: 'ta4',
      name: 'Surprised_Pikachu.jpg',
      path: '../src/assets/templates/tech/Surprised_Pikachu.jpg',
      description: 'A yellow cartoon character with wide eyes and an open mouth, showing shock or surprise.',
    },
  ],

  daily: [
    {
      templateId: 'ds1',
      name: 'You_know_Im_something_of_a_scientist_myself.jpg',
      path: '../src/assets/templates/daily/You_know_Im_something_of_a_scientist_myself.jpg',
      description: 'A man wearing glasses smiling proudly, leaning slightly forward, appearing self-satisfied.',
    },
    {
      templateId: 'ds2',
      name: 'Laughing_Leo.jpg',
      path: '../src/assets/templates/daily/Laughing_Leo.jpg',
      description: 'Leonardo DiCaprio laughing confidently from a formal scene.',
    },
    {
      templateId: 'ds3',
      name: 'You_Guys_Are_Getting_Paid.jpg',
      path: '../src/assets/templates/daily/You_Guys_Are_Getting_Paid.jpg',
      description: 'A man with a confused and annoyed expression, appearing surprised or incredulous.',
    },
    {
      templateId: 'ds4',
      name: 'Disaster_Girl.jpg',
      path: '../src/assets/templates/daily/Disaster_Girl.jpg',
      description: 'A young girl smiling slightly in front of a house on fire; commonly used to imply chaos or mischief.',
    },
  ],
};

// Logs the templates for clarity
function logTemplates() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 Templates referenced in this test (12 total)');
  console.log('='.repeat(70));
  for (const [category, list] of Object.entries(TEMPLATES)) {
    console.log(`\n🔹 Category: ${category} (${list.length} templates)`);
    list.forEach(t => console.log(`   - ${t.templateId}: ${t.name} — ${t.description}`));
  }
}

// Runs hf-refine-caption for a single category using the first template in that category
async function testRefineForCategory(categoryKey) {
  const categoryMap = {
    student: 'Student Life',
    tech: 'Technology/AI',
    daily: 'Daily Struggles',
  };

  const templates = TEMPLATES[categoryKey];
  if (!templates || templates.length === 0) throw new Error(`No templates for category ${categoryKey}`);
  const selectedTemplate = templates[0];

  console.log('\n' + '-'.repeat(60));
  console.log(`✳️ Testing hf-refine-caption for category: ${categoryMap[categoryKey]} (using ${selectedTemplate.name})`);
  console.log('-'.repeat(60));

  try {
    const base64Image = loadImageAsBase64(selectedTemplate.path);
    console.log(`✅ Loaded template: ${selectedTemplate.name} (${(base64Image.length / 1024).toFixed(2)} KB)`);

    // Example human captions tailored to the category (3 options)
    const humanCaptionsByCategory = {
      student: [
        'Finals week is just a myth invented by professors',
        'Student life: 99% stress, 1% actually learning',
        'Sleep, study, social life - pick two',
      ],
      tech: [
        'When the AI fixes one bug and creates five new features',
        'I trained for 2 hours and now my model judges me',
        'Trust me, it compiled on my machine',
      ],
      daily: [
        'I had one job and I still managed to mess it up',
        'Mondays: built-in regret for the weekend choices',
        'Coffee: the only reliable relationship I have',
      ],
    };

    const humanCaptions = humanCaptionsByCategory[categoryKey];
    console.log('\n📝 Human Captions:');
    humanCaptions.forEach((c, i) => console.log(`   ${i + 1}. "${c}"`));

    const requestBody = {
      topic: categoryMap[categoryKey],
      templateBase64: base64Image,
      templateMimeType: 'image/jpeg',
      humanCaptions,
    };

    console.log('\n📤 Calling hf-refine-caption...');
    const start = Date.now();
    const data = await callEdgeFunction('hf-refine-caption', requestBody);
    const time = Date.now() - start;

    if (data && data.finalCaption) {
      console.log(`\n✅ Success (${time}ms)\n✨ Final Refined Caption:\n   "${data.finalCaption}"\n`);
      return true;
    } else {
      console.error('\n❌ Unexpected response from hf-refine-caption:', data);
      return false;
    }
  } catch (err) {
    console.error('\n❌ TEST FAILED for category', categoryKey, ':', err.message);
    return false;
  }
}

// Main runner: log templates, run refine for each category, summarize
async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('🚀 SUPABASE EDGE FUNCTIONS - hf-refine-caption TESTS');
  console.log('█'.repeat(70));
  console.log(`\nConfiguration:  Supabase URL: ${SUPABASE_URL}`);

  logTemplates();

  const categories = ['student', 'tech', 'daily'];
  const results = {};
  for (const cat of categories) {
    const ok = await testRefineForCategory(cat);
    results[cat] = ok;
  }

  console.log('\n' + '█'.repeat(40));
  console.log('📊 TEST SUMMARY');
  console.log('█'.repeat(40));
  categories.forEach(cat => console.log(`  ${cat.padEnd(8)}:  ${results[cat] ? '✅ PASSED' : '❌ FAILED'}`));

  const allPassed = categories.every(c => results[c]);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(err => {
  console.error('\n💥 FATAL ERROR:', err);
  process.exit(1);
});
