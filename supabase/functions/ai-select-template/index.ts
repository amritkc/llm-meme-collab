import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TemplateInput {
  templateId: string | number;
  base64: string;
  mimeType: string;
  description?: string;
}

interface RequestBody {
  topic: string;
  templates: TemplateInput[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { topic, templates }: RequestBody = await req.json();

    // Validation
    if (!topic || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!Array.isArray(templates) || templates.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one template is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5-mini";

    // Build content array with interleaved text and images
    const content: any[] = [
      {
        type: "text",
        text: `Topic: ${topic}\n\nPlease carefully examine each template image and select the one that best fits the given topic. Return the ID of your selected template.`,
      },
    ];

    // Add templates with images interleaved
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      
      // Add template info text
      let templateInfo = `\n--- Template ${i + 1} ---\nTemplate ID: ${template.templateId}`;
      if (template.description) {
        templateInfo += `\nDescription: ${template.description}`;
      }
      
      content.push({
        type: "text",
        text: templateInfo,
      });

      // Immediately follow with the image
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${template.mimeType};base64,${template.base64}`,
        },
      });
    }

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are given four meme templates to choose from, please choose the best fitting meme template for the given topic, dont just always choose the first template. Output JSON only (the ID of the chosen template).",
            },
            {
              role: "user",
              content,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "select_template_response",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  selectedTemplateId: {
                    description: "The ID of the selected template",
                    anyOf: [{ type: "string" }, { type: "number" }],
                  },
                },
                required: ["selectedTemplateId"],
                additionalProperties: false,
              },
            },
          },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API request failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const responseContent = openaiData.choices[0]?.message?.content;

    if (!responseContent) {
      return new Response(
        JSON.stringify({ error: "OpenAI returned empty response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const parsedResponse = JSON.parse(responseContent);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
