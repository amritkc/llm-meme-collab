import { supabase } from '../lib/supabaseClient';
import { imagePathToBase64 } from '../utils/imageToBase64';

// Type definitions
export interface TemplateInput {
  templateId: string | number;
  base64: string;
  mimeType: string;
  description?: string;
}

export interface SelectTemplateRequest {
  topic: string;
  templates: TemplateInput[];
}

export interface SelectTemplateResponse {
  selectedTemplateId: string | number;
}

export interface GenerateCaptionsRequest {
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
}

export interface GenerateCaptionsResponse {
  aiCaptions: [string, string, string];
}

export interface RefineCaptionRequest {
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
  humanCaptions: [string, string, string];
}

export interface RefineCaptionResponse {
  finalCaption: string;
}

/**
 * Call the ai-select-template edge function
 */
export async function selectTemplate(
  request: SelectTemplateRequest
): Promise<SelectTemplateResponse> {
  const { data, error } = await supabase.functions.invoke('ai-select-template', {
    body: request,
  });

  if (error) {
    throw new Error(`Failed to select template: ${error.message}`);
  }

  if (!data || !data.selectedTemplateId) {
    throw new Error('Invalid response from ai-select-template');
  }

  return data;
}

/**
 * Call the ai-generate-captions edge function
 */
export async function generateCaptions(
  request: GenerateCaptionsRequest
): Promise<GenerateCaptionsResponse> {
  const { data, error } = await supabase.functions.invoke('ai-generate-captions', {
    body: request,
  });

  if (error) {
    throw new Error(`Failed to generate captions: ${error.message}`);
  }

  if (!data || !Array.isArray(data.aiCaptions) || data.aiCaptions.length !== 3) {
    throw new Error('Invalid response from ai-generate-captions');
  }

  return data;
}

/**
 * Call the hf-refine-caption edge function
 */
export async function refineCaption(
  request: RefineCaptionRequest
): Promise<RefineCaptionResponse> {
  const { data, error } = await supabase.functions.invoke('hf-refine-caption', {
    body: request,
  });

  if (error) {
    throw new Error(`Failed to refine caption: ${error.message}`);
  }

  if (!data || !data.finalCaption) {
    throw new Error('Invalid response from hf-refine-caption');
  }

  return data;
}

/**
 * Helper: Load template images and prepare for selectTemplate call
 */
export async function prepareTemplatesForSelection(
  templatePaths: Array<{ id: string | number; path: string; description?: string }>
): Promise<TemplateInput[]> {
  const templates: TemplateInput[] = [];

  for (const template of templatePaths) {
    const { base64, mimeType } = await imagePathToBase64(template.path);
    templates.push({
      templateId: template.id,
      base64,
      mimeType,
      description: template.description,
    });
  }

  return templates;
}

/**
 * Helper: Prepare a single template for caption generation
 */
export async function prepareTemplateForCaptions(
  templatePath: string
): Promise<{ base64: string; mimeType: string }> {
  return await imagePathToBase64(templatePath);
}
