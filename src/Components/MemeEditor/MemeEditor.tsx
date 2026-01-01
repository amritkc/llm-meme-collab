import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Slider,
  Stack,
  Typography,
  Paper,
  TextField,
} from "@mui/material";

export type MemeTextLayer = {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  fontSize: number;
  locked?: boolean; // locked layers can't be deleted (best caption)
};

type DragState = {
  layerId: string;
  startClientX: number;
  startClientY: number;
  startXPct: number;
  startYPct: number;
};

export default function MemeEditor({
  imageUrl,
  layers,
  onLayersChange,
  disabled,
  maxWidth = 600,
  maxHeight = 380,
}: {
  imageUrl: string | null;
  layers: MemeTextLayer[];
  onLayersChange: (layers: MemeTextLayer[]) => void;
  disabled?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0]?.id ?? "");
  const [drag, setDrag] = useState<DragState | null>(null);

  const activeLayer = useMemo(
    () => layers.find((l) => l.id === activeLayerId) ?? layers[0],
    [layers, activeLayerId]
  );

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const updateLayer = (id: string, patch: Partial<MemeTextLayer>) => {
    onLayersChange(layers.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const onPointerDown = (e: React.PointerEvent, layerId: string) => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveLayerId(layerId);

    setDrag({
      layerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: layer.xPct,
      startYPct: layer.yPct,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || disabled) return;
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    const dxPct = (dx / rect.width) * 100;
    const dyPct = (dy / rect.height) * 100;

    updateLayer(drag.layerId, {
      xPct: clamp(drag.startXPct + dxPct, 0, 95),
      yPct: clamp(drag.startYPct + dyPct, 0, 95),
    });
  };

  const onPointerUp = () => setDrag(null);

  if (!imageUrl) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select a template to start editing.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Canvas */}
      <Box
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth,
          mx: "auto",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          userSelect: "none",
          touchAction: "none",
          bgcolor: "black",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt="meme"
          sx={{
            width: "100%",
            display: "block",
            objectFit: "contain",
            maxHeight,
          }}
        />

        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const visible = layer.text.trim().length > 0;

          return (
            <Box
              key={layer.id}
              onPointerDown={(e) => onPointerDown(e, layer.id)}
              onClick={() => setActiveLayerId(layer.id)}
              sx={{
                position: "absolute",
                left: `${layer.xPct}%`,
                top: `${layer.yPct}%`,
                cursor: disabled ? "not-allowed" : "grab",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: "1px dashed",
                borderColor: isActive ? "primary.main" : "rgba(255,255,255,0.35)",
                bgcolor: isActive ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)",
                opacity: visible ? 1 : 0.35,
                maxWidth: "92%",
              }}
            >
              <Typography
                sx={{
                  fontSize: layer.fontSize,
                  fontWeight: 900,
                  color: "white",
                  textShadow: "0px 2px 6px rgba(0,0,0,0.85)",
                  lineHeight: 1.05,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {layer.text.trim().length ? layer.text : "Empty text"}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Controls */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" fontWeight={800}>
            Selected text box
          </Typography>

          <TextField
            label="Text"
            value={activeLayer?.text ?? ""}
            onChange={(e) => {
              if (!activeLayer) return;
              updateLayer(activeLayer.id, { text: e.target.value });
            }}
            fullWidth
            disabled={disabled}
          />

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Font size ({activeLayer?.fontSize ?? 24}px)
            </Typography>
            <Slider
              min={14}
              max={72}
              step={1}
              value={activeLayer?.fontSize ?? 32}
              onChange={(_, v) => {
                if (!activeLayer) return;
                updateLayer(activeLayer.id, { fontSize: v as number });
              }}
              disabled={disabled}
            />
          </Stack>

          {activeLayer?.locked && (
            <Typography variant="caption" color="text.secondary">
              The main (best) caption is locked and cannot be deleted.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
