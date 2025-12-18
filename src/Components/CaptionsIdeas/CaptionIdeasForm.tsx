import React from "react";
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

export default function CaptionIdeasForm({
  ideas,
  bestIdeaIndex,
  onIdeasChange,
  onBestChange,
}: {
  ideas: [string, string, string];
  bestIdeaIndex: 0 | 1 | 2;
  onIdeasChange: (next: [string, string, string]) => void;
  onBestChange: (idx: 0 | 1 | 2) => void;
}) {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 800 }}>Pick the best caption</FormLabel>
          <Typography variant="caption" color="text.secondary">
            The chosen caption will be placed as the main meme text.
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

      {[0, 1, 2].map((i) => (
        <TextField
          key={i}
          label={`Idea ${i + 1}`}
          value={ideas[i]}
          onChange={(e) => {
            const next = [...ideas] as [string, string, string];
            next[i] = e.target.value;
            onIdeasChange(next);
          }}
          fullWidth
          inputProps={{ maxLength: 140 }}
          helperText={`${ideas[i].length}/140 (min 3 chars)`}
        />
      ))}
    </Stack>
  );
}
