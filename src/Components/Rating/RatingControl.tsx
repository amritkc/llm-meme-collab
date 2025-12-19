import { Box, Slider, Stack, Typography } from "@mui/material";

type Mark = { value: number; label: string };

type Props = {
  label: string;
  value: number;
  onChange(v: number): void;
  marks?: Mark[];
  sx?: any;
};

export default function RatingControl({ label, value, onChange, marks, sx }: Props) {
  const defaultMarks: Mark[] = [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
  ];

  return (
    <Box sx={{ width: "100%", ...sx }}>
      <Stack spacing={0.75}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Stack>

        {/* Give extra bottom space so mark labels don't look cramped */}
        <Box sx={{ pb: 1.25 }}>
          <Slider
            value={value}
            onChange={(_, v) => onChange(v as number)}
            min={1}
            max={5}
            step={1}
            marks={marks?.length ? marks : defaultMarks}
            valueLabelDisplay="off"
            sx={{
              px: 0.5,

              // Track / Rail thickness
              "& .MuiSlider-rail": { opacity: 0.25, height: 8 },
              "& .MuiSlider-track": { height: 8 },

              // Thumb
              "& .MuiSlider-thumb": {
                width: 18,
                height: 18,
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              },

              // Tick marks
              "& .MuiSlider-mark": {
                width: 2,
                height: 10,
                opacity: 0.65,
                // align ticks visually with the thicker rail
                marginTop: -1,
              },

              // ✅ Fix label positioning + font so "1 2 3 4 5" looks clean & centered
              "& .MuiSlider-markLabel": {
                top: 28, // push labels down away from rail
                fontSize: 12,
                fontWeight: 600,
                color: "text.secondary",
                transform: "translateX(-50%)", // ensure perfect centering
                whiteSpace: "nowrap",
              },

              // keep focus ring clean
              "& .MuiSlider-thumb:focus, & .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-active": {
                boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
              },
            }}
            aria-label={`${label} rating`}
          />
        </Box>
      </Stack>
    </Box>
  );
}
