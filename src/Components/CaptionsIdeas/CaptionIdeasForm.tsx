import {
  Stack,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Typography,
} from "@mui/material";
import type { MemeTextLayer } from "../MemeEditor/MemeEditor";

type IdeaState = { layers: MemeTextLayer[] };

function makeId(prefix = "extra") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function CaptionIdeasForm({
  ideas,
  bestIdeaIndex,
  onIdeaLayersChange,
  onBestChange,
  hideBestPicker = false,
}: {
  ideas: [IdeaState, IdeaState, IdeaState];
  bestIdeaIndex: 0 | 1 | 2;
  onIdeaLayersChange: (idx: 0 | 1 | 2, layers: MemeTextLayer[]) => void;
  onBestChange: (idx: 0 | 1 | 2) => void;
  hideBestPicker?: boolean;
}) {
  const getCaptionLayer = (layers: MemeTextLayer[]) =>
    layers.find((l) => l.locked) ?? layers[0];

  const setCaptionText = (layers: MemeTextLayer[], text: string) =>
    layers.map((l) => (l.locked ? { ...l, text } : l));

  return (
    <Stack spacing={2}>
      {!hideBestPicker && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <FormControl>
            <FormLabel sx={{ fontWeight: 800 }}>Pick the best idea</FormLabel>
            <Typography variant="caption" color="text.secondary">
              The selected idea will appear on the image editor.
            </Typography>

            <RadioGroup
              value={String(bestIdeaIndex)}
              onChange={(e) => onBestChange(Number(e.target.value) as 0 | 1 | 2)}
            >
              {[0, 1, 2].map((i) => (
                <FormControlLabel
                  key={i}
                  value={String(i)}
                  control={<Radio />}
                  label={`Idea ${i + 1}`}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>
      )}

      {[0, 1, 2].map((i) => {
        const layers = ideas[i].layers;
        const caption = getCaptionLayer(layers);
        return (
          <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              Idea {i + 1}
            </Typography>

            <TextField
              label="Caption"
              value={caption?.text ?? ""}
              onChange={(e) => onIdeaLayersChange(i as 0 | 1 | 2, setCaptionText(layers, e.target.value))}
              fullWidth
              inputProps={{ maxLength: 140 }}
              helperText={`${(caption?.text ?? "").length}/140 (min 3 chars)`}
            />
          </Paper>
        );
      })}
    </Stack>
  );
}
