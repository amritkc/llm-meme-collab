import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  topic: string;
  templateBase64: string;
  templateMimeType: string;
  descriptionOfMemeTemplate?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { topic, templateBase64, templateMimeType, descriptionOfMemeTemplate }: RequestBody = await req.json();

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

    if (!templateBase64 || !templateMimeType) {
      return new Response(
        JSON.stringify({ error: "Template image is required" }),
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

    // Build user message
    let userMessage = `Topic: ${topic}\n\n`;
    if (descriptionOfMemeTemplate) {
      userMessage += `Template Description: ${descriptionOfMemeTemplate}\n\n`;
    }
    userMessage += `Generate 3 funny, short captions for this meme template about the topic. Make them clever and relatable. Try to find situations that fit for the topic.`;

    // Build content array with text + image
    const content = [
      {
        type: "text",
        text: userMessage,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${templateMimeType};base64,${templateBase64}`,
        },
      },
    ];

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
                "You are a meme caption generator. Generate exactly 3 funny, short captions. Output JSON only.",
            },
            {
              role: "user",
              content,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generate_captions_response",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  aiCaptions: {
                    type: "array",
                    description: "Array of exactly 3 caption strings",
                    items: {
                      type: "string",
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["aiCaptions"],
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

    // Validate we got exactly 3 captions
    if (!Array.isArray(parsedResponse.aiCaptions) || parsedResponse.aiCaptions.length !== 3) {
      return new Response(
        JSON.stringify({ error: "OpenAI did not return exactly 3 captions" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
