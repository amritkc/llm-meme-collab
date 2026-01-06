import { supabase } from "./supabaseClient";

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta?.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function safePart(s: string) {
  return String(s ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Upload image to Supabase Storage and insert metadata row into DB.
 * If DB insert fails, it deletes the uploaded file (no orphan images).
 */
export async function uploadMemeAndInsertRow(args: {
  bucket: string; // "memes"
  table?: string; // DB table name (defaults to "meme_submissions")
  participantId: string;
  prolificPid: string | null;
  studyId: string | null;
  sessionId: string | null;
  task: string;
  topicId: string;
  templateId: string;
  ideaIndex: number;
  caption: string;
  layers: any;
  memeDataUrl: string; // base64 PNG from exportMemePNG
}) {
  const {
    bucket,
    table = "meme_submissions",
    participantId,
    prolificPid,
    studyId,
    sessionId,
    task,
    topicId,
    templateId,
    ideaIndex,
    caption,
    layers,
    memeDataUrl,
  } = args;

  const pid = safePart(participantId);
  const t = safePart(topicId);
  const tpl = safePart(templateId);

  const filePath = `${pid}/${t}__${tpl}__idea${ideaIndex}__${Date.now()}.png`;
  const blob = dataUrlToBlob(memeDataUrl);

  // 1) Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, blob, {
      contentType: "image/png",
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // Public URL (bucket must be Public)
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const publicUrl = pub.publicUrl;

  // 2) Insert row into DB
  const { data: row, error: insertError } = await supabase
    .from(table)
    .insert([
      {
        participant_id: participantId,
        prolific_pid: prolificPid,
        study_id: studyId,
        session_id: sessionId,
        task,
        topic_id: topicId,
        template_id: templateId,
        idea_index: ideaIndex,
        caption,
        layers,
        image_path: filePath,
        image_url: publicUrl,
      },
    ])
    .select()
    .single();

  // If DB insert fails, delete uploaded file so you don't have orphan images
  if (insertError) {
    await supabase.storage.from(bucket).remove([filePath]);
    throw new Error(`DB insert failed: ${insertError.message}`);
  }

  return { row, filePath, publicUrl };
}
