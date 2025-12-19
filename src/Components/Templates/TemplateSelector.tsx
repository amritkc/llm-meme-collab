import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";

export type MemeTemplate = {
  id: string;
  title: string;
  imageUrl: string;
};

export default function TemplateSelector({
  templates,
  selectedId,
  onSelect,
}: {
  templates: MemeTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr" }, gap: 1.5 }}>
      {templates.map((t) => {
        const selected = t.id === selectedId;
        return (
          <Card
            key={t.id}
            sx={{
              border: "2px solid",
              borderColor: selected ? "primary.main" : "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <CardActionArea onClick={() => onSelect(t.id)}>
              <Box
                component="img"
                src={t.imageUrl}
                alt={t.title}
                sx={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
              />
              <CardContent sx={{ py: 1 }}>
                <Typography variant="body2" fontWeight={800}>
                  {t.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected ? "Selected" : "Tap to select"}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
