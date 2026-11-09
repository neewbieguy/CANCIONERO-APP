export type TemplateMoment = { kind: "moment"; title: string; durationMin?: number };
export type TemplateSongSlot = { kind: "song_slot"; count: number };
export type TemplateBlock = TemplateMoment | TemplateSongSlot;

export type EventTemplate = {
  id: string;
  name: string;
  description: string;
  defaultTitle: string;
  defaultHour: number; // hora local por defecto
  durationMin: number;
  defaultRoles: string[];
  blocks: TemplateBlock[];
};

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "sunday_service",
    name: "Servicio dominical",
    description: "Bienvenida, alabanza, oración, anuncios, ofrenda y cierre.",
    defaultTitle: "Servicio dominical",
    defaultHour: 10,
    durationMin: 120,
    defaultRoles: ["Líder de alabanza", "Voz principal", "Coros", "Guitarra acústica", "Bajo", "Batería", "Teclado", "Sonido", "Proyección"],
    blocks: [
      { kind: "moment", title: "Bienvenida", durationMin: 5 },
      { kind: "song_slot", count: 3 },
      { kind: "moment", title: "Oración", durationMin: 5 },
      { kind: "moment", title: "Anuncios", durationMin: 5 },
      { kind: "moment", title: "Ofrenda", durationMin: 5 },
      { kind: "song_slot", count: 1 },
      { kind: "moment", title: "Prédica", durationMin: 40 },
      { kind: "song_slot", count: 1 },
      { kind: "moment", title: "Bendición final", durationMin: 3 },
    ],
  },
  {
    id: "rehearsal",
    name: "Ensayo",
    description: "Calentamiento, repaso de canciones y devocional.",
    defaultTitle: "Ensayo",
    defaultHour: 19,
    durationMin: 120,
    defaultRoles: ["Líder de alabanza", "Voz principal", "Coros", "Guitarra acústica", "Bajo", "Batería", "Teclado"],
    blocks: [
      { kind: "moment", title: "Devocional", durationMin: 10 },
      { kind: "moment", title: "Calentamiento", durationMin: 10 },
      { kind: "song_slot", count: 4 },
      { kind: "moment", title: "Notas y cierre", durationMin: 10 },
    ],
  },
  {
    id: "concert",
    name: "Concierto",
    description: "Apertura, bloques de canciones, intermedio y cierre.",
    defaultTitle: "Concierto",
    defaultHour: 20,
    durationMin: 150,
    defaultRoles: ["Voz principal", "Coros", "Guitarra eléctrica", "Bajo", "Batería", "Teclado", "Sonido", "Luces", "Transmisión"],
    blocks: [
      { kind: "moment", title: "Apertura", durationMin: 5 },
      { kind: "song_slot", count: 4 },
      { kind: "moment", title: "Intermedio", durationMin: 15 },
      { kind: "song_slot", count: 4 },
      { kind: "moment", title: "Cierre y agradecimientos", durationMin: 5 },
    ],
  },
  {
    id: "custom",
    name: "En blanco",
    description: "Empezá de cero y armá el setlist a tu manera.",
    defaultTitle: "Nuevo evento",
    defaultHour: 19,
    durationMin: 90,
    defaultRoles: [],
    blocks: [],
  },
];

export const MOMENT_PRESETS = [
  "Bienvenida",
  "Oración",
  "Anuncios",
  "Ofrenda",
  "Lectura bíblica",
  "Prédica",
  "Santa Cena",
  "Testimonio",
  "Intermedio",
  "Bendición final",
];

export function getTemplate(id: string) {
  return EVENT_TEMPLATES.find((t) => t.id === id) ?? EVENT_TEMPLATES[EVENT_TEMPLATES.length - 1];
}

export function templateLabel(id: string) {
  return getTemplate(id).name;
}
