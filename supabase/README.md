# Supabase Edge Functions

Three edge functions that use OpenAI's Vision API to handle meme generation workflows.

## Setup

An instance of Docker Must Be running (Docker Desktop or RancherDesktop)

1. **Install Supabase CLI**
```bash
npm install -g supabase
```

if it doesnt work then
npx supabase init
and then use the force command
npx supabase init --force  

2. **Configure environment variables**

Edit `.env.local` in the project root:
```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
```

3. **Start Supabase locally**
```bash
npx supabase start
```

Save the output credentials (API URL and anon key).

4. **Serve edge functions**

In a new terminal:
```bash
npx supabase functions serve --env-file .env.local
```

5. **Run tests**
```bash
node supabase/test-edge-functions.cjs
```

---

## Edge Functions

### 1. ai-select-template

Selects the best meme template for a topic.

**Endpoint**: `/functions/v1/ai-select-template`

**Input**:
```typescript
{
  topic: string;
  templates: Array<{
    templateId: string | number;
    base64: string;
    mimeType: string;
    description?: string;
  }>;
}
```

**Output**:
```typescript
{
  selectedTemplateId: string | number;
}
```

**Example**:
```typescript
const result = await selectTemplate({
  topic: 'Procrastination',
  templates: [
    { templateId: '00', base64: '...', mimeType: 'image/jpeg' },
    { templateId: '01', base64: '...', mimeType: 'image/jpeg' },
  ],
});
// Returns: { selectedTemplateId: '01' }
```

---

### 2. ai-generate-captions

Generates 3 captions for a meme template.

**Endpoint**: `/functions/v1/ai-generate-captions`

**Input**:
```typescript
{
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
}
```

**Output**:
```typescript
{
  aiCaptions: [string, string, string];
}
```

**Example**:
```typescript
const result = await generateCaptions({
  topic: 'Monday mornings',
  templateBase64: '...',
  templateMimeType: 'image/jpeg',
});
// Returns: { aiCaptions: ["Caption 1", "Caption 2", "Caption 3"] }
```

---

### 3. hf-refine-caption

Picks the best of 3 human captions and improves it.

**Endpoint**: `/functions/v1/hf-refine-caption`

**Input**:
```typescript
{
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
  humanCaptions: [string, string, string];
}
```

**Output**:
```typescript
{
  finalCaption: string;
}
```

**Example**:
```typescript
const result = await refineCaption({
  topic: 'Debugging',
  templateBase64: '...',
  templateMimeType: 'image/jpeg',
  humanCaptions: [
    'When code works but you don\'t know why',
    'Debugging at 3 AM',
    'Stack Overflow saves the day',
  ],
});
// Returns: { finalCaption: "When your code works but you have no idea why" }
```

---

## Frontend Integration

### Service Layer (`src/services/llm.ts`)

The frontend service provides typed functions to call the edge functions:

```typescript
import { 
  selectTemplate, 
  generateCaptions, 
  refineCaption,
  prepareTemplatesForSelection,
  prepareTemplateForCaptions
} from '@/services/llm';
```

**How it works**:
1. Service layer calls Supabase edge functions via HTTP
2. Helper functions convert images to base64
3. Responses are typed and validated
4. Errors are caught and formatted

**Example usage**:
```typescript
// Prepare template
const { base64, mimeType } = await prepareTemplateForCaptions(
  '/src/assets/templates/doge.jpg'
);

// Generate captions
const result = await generateCaptions({
  topic: 'Student Life',
  templateBase64: base64,
  templateMimeType: mimeType,
});
```

### Image Utilities (`src/utils/imageToBase64.ts`)

Helper functions for image conversion:
- `imageToBase64(file)` - Convert File to base64
- `imagePathToBase64(path)` - Load and convert image from path
- `getMimeTypeFromExtension(filename)` - Get MIME type

---

## Error Handling

All functions return errors in this format:
```typescript
{ error: string }
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `500` - Internal Server Error

**Example**:
```typescript
try {
  const result = await generateCaptions({...});
} catch (error) {
  console.error('Failed:', error.message);
}
```

---

## Deployment

Deploy to Supabase Cloud:

```bash
# Login
npx supabase login

# Link project
npx supabase link --project-ref <your-project-ref>

# Deploy functions
npx supabase functions deploy ai-select-template
npx supabase functions deploy ai-generate-captions
npx supabase functions deploy hf-refine-caption
```

Set environment variables in Supabase Dashboard (Project Settings > Edge Functions):
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

---

## File Structure

```
supabase/
├── README.md                      # This file
├── test-edge-functions.cjs        # Test script
├── config.toml                    # Supabase config
└── functions/
    ├── ai-select-template/
    │   ├── index.ts
    │   └── deno.json
    ├── ai-generate-captions/
    │   ├── index.ts
    │   └── deno.json
    └── hf-refine-caption/
        ├── index.ts
        └── deno.json

src/
├── services/llm.ts               # Frontend service layer
├── utils/imageToBase64.ts        # Image utilities
└── assets/templates/             # Meme templates
```

---

## Troubleshooting

**TypeScript errors in VS Code**: Reload window (`Ctrl+Shift+P` → "Reload Window")

**Function returns 500**: Check logs with `npx supabase functions logs`

**Test fails**: 
- Ensure Supabase is running: `npx supabase start`
- Ensure functions are served: `npx supabase functions serve --env-file .env.local`
- Check `.env.local` has valid `OPENAI_API_KEY`

---

## Cost Estimates (gpt-4o-mini)

- Template selection: ~$0.001-0.002 per request
- Caption generation: ~$0.0005 per request
- Caption refinement: ~$0.0005 per request
