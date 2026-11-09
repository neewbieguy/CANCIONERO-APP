/**
 * Datos de ejemplo para ver Cancionero lleno.
 * Usuario principal: demo@cancionero.app (botón "Entrar como demo").
 * Las letras son originales, escritas solo para la demo.
 */
import { PrismaClient, type Song } from "@prisma/client";
import { addDays, setHours, setMinutes, startOfDay, subDays, subMinutes, nextSunday, nextThursday } from "date-fns";
import { randomBytes } from "node:crypto";
import { diatonicChords } from "../src/lib/music/transpose";

const db = new PrismaClient();

// ---------- Generador de hojas ChordPro ----------

/** Coloca dos acordes por línea (al inicio y a mitad de la frase). */
function chordLine(text: string, a: string, b: string) {
  const words = text.split(" ");
  const mid = Math.max(1, Math.floor(words.length / 2));
  return `[${a}]${words.slice(0, mid).join(" ")} [${b}]${words.slice(mid).join(" ")}`;
}

function buildSheet(s: SongSeed) {
  const [I, ii, iii, IV, V, vi] = diatonicChords(s.key);
  const verseProg: [string, string][] = [[I, V], [vi, IV], [I, V], [IV, V]];
  const chorusProg: [string, string][] = [[IV, I], [V, vi], [IV, I], [ii, V]];
  const bridgeProg: [string, string][] = [[vi, IV], [I, V], [vi, IV], [iii, V]];
  const block = (lines: string[], prog: [string, string][]) =>
    lines.map((l, i) => chordLine(l, prog[i % prog.length][0], prog[i % prog.length][1])).join("\n");

  return [
    `{title: ${s.title}}`,
    `{artist: ${s.artist}}`,
    `{key: ${s.key}}`,
    `{tempo: ${s.bpm}}`,
    "",
    `{comment: Intro: ${I} - ${V} - ${vi} - ${IV}}`,
    "",
    "{start_of_verse: Verso 1}",
    block(s.verse, verseProg),
    "{end_of_verse}",
    "",
    "{start_of_chorus: Coro}",
    block(s.chorus, chorusProg),
    "{end_of_chorus}",
    ...(s.bridge
      ? ["", "{start_of_bridge: Puente}", block(s.bridge, bridgeProg), "{end_of_bridge}"]
      : []),
    "",
    `{comment: Final: repetir coro y terminar en ${I}}`,
  ].join("\n");
}

type SongSeed = {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  tags: string;
  verse: string[];
  chorus: string[];
  bridge?: string[];
};

const SONGS: SongSeed[] = [
  {
    title: "Amanecer de gracia",
    artist: "Comunidad Viva",
    key: "G",
    bpm: 72,
    tags: "adoración,lenta",
    verse: ["Cuando la noche se vuelve larga", "tu luz despierta mi corazón", "como el rocío sobre la tierra", "llega tu gracia, llega tu amor"],
    chorus: ["Amanecer de gracia en mí", "todo lo nuevo empieza aquí", "canto a tu nombre sin temor", "eres mi luz, mi Salvador"],
    bridge: ["No hay sombra que te pueda apagar", "no hay noche que no puedas cambiar"],
  },
  {
    title: "Río de vida",
    artist: "Banda Horizonte",
    key: "D",
    bpm: 128,
    tags: "celebración,rápida",
    verse: ["Hay un río que trae alegría", "corre libre por esta ciudad", "donde llega todo florece", "donde pasa hay libertad"],
    chorus: ["Que fluya el río, que fluya hoy", "en cada pueblo, en cada voz", "saltamos juntos, cantamos más", "tu río de vida no para jamás"],
  },
  {
    title: "Tu nombre es refugio",
    artist: "Comunidad Viva",
    key: "E",
    bpm: 68,
    tags: "adoración,oración",
    verse: ["En medio de la tormenta", "escucho tu voz de paz", "me escondo bajo tus alas", "y nada me faltará"],
    chorus: ["Tu nombre es refugio", "tu nombre es mi hogar", "aunque tiemble la tierra", "en ti voy a descansar"],
    bridge: ["Fuerte torre, roca eterna", "en tus manos estaré"],
  },
  {
    title: "Somos uno",
    artist: "Coro Encuentro",
    key: "A",
    bpm: 110,
    tags: "comunidad,media",
    verse: ["De cada rincón venimos", "con historias para contar", "una mesa nos reúne", "un mismo pan, un mismo altar"],
    chorus: ["Somos uno en tu amor", "muchas voces, un solo clamor", "de la mano vamos a andar", "nadie se queda atrás"],
  },
  {
    title: "Fiel por siempre",
    artist: "Banda Horizonte",
    key: "C",
    bpm: 76,
    tags: "adoración,himno",
    verse: ["Las estaciones van cambiando", "los años pasan sin parar", "pero tu amor no se ha movido", "siempre fiel, siempre igual"],
    chorus: ["Fiel por siempre, fiel tu amor", "grande es tu fidelidad, Señor", "cada mañana nueva es", "tu misericordia otra vez"],
    bridge: ["Ayer, hoy y mañana", "tu palabra no fallará"],
  },
  {
    title: "Grita de alegría",
    artist: "Jóvenes en Marcha",
    key: "B",
    bpm: 140,
    tags: "celebración,rápida,jóvenes",
    verse: ["Levanto mis manos al cielo", "no puedo quedarme callado", "lo que hiciste por mí es tan grande", "mi corazón está renovado"],
    chorus: ["Grita de alegría, toda la creación", "salta, baila, canta esta canción", "el que estaba lejos ya volvió", "hay fiesta en casa, hay fiesta hoy"],
  },
  {
    title: "Silencio santo",
    artist: "Coro Encuentro",
    key: "F",
    bpm: 60,
    tags: "adoración,lenta,santa cena",
    verse: ["Me acerco en silencio", "con el alma descalza", "no traigo más que mi vida", "y una oración callada"],
    chorus: ["Silencio santo, aquí estás", "en lo profundo me hablarás", "no necesito nada más", "que estar contigo en paz"],
  },
  {
    title: "Camino contigo",
    artist: "Comunidad Viva",
    key: "D",
    bpm: 92,
    tags: "media,confianza",
    verse: ["Si el camino se hace estrecho", "si no veo dónde pisar", "tu mano firme me sostiene", "y me enseña a caminar"],
    chorus: ["Camino contigo, no tengo temor", "valles y montes, tú vas mejor", "paso a paso me guiarás", "hasta llegar a tu hogar"],
  },
  {
    title: "Corona de luz",
    artist: "Banda Horizonte",
    key: "Bb",
    bpm: 84,
    tags: "adoración,majestad",
    verse: ["Los cielos cuentan tu gloria", "el mar repite tu canción", "las estrellas te coronan", "rey de toda la creación"],
    chorus: ["Corona de luz, trono de verdad", "santo, santo por la eternidad", "todo lo que respira hoy", "te dará la gloria, oh Dios"],
    bridge: ["Digno, digno es el Cordero", "digno de toda adoración"],
  },
  {
    title: "Nuevas misericordias",
    artist: "Coro Encuentro",
    key: "G",
    bpm: 80,
    tags: "media,himno",
    verse: ["Abro los ojos y estás", "antes que el sol en mi ventana", "me recibes con tu abrazo", "me regalas un mañana"],
    chorus: ["Nuevas misericordias cada día", "nuevo tu amor, nueva mi alegría", "lo que ayer se derrumbó", "hoy lo vuelves a levantar"],
  },
  {
    title: "Fuego en el altar",
    artist: "Jóvenes en Marcha",
    key: "Em",
    bpm: 124,
    tags: "rápida,avivamiento",
    verse: ["Que no se apague la llama", "que no se enfríe el corazón", "enciende en nosotros tu fuego", "renueva nuestra pasión"],
    chorus: ["Fuego en el altar, fuego en mi ser", "quema lo viejo, hazme nacer", "arde en mi pecho tu verdad", "fuego que no se apagará"],
  },
  {
    title: "Te doy gracias",
    artist: "Comunidad Viva",
    key: "A",
    bpm: 100,
    tags: "gratitud,media",
    verse: ["Por la mesa servida", "por el techo y el pan", "por los amigos que caminan", "por la vida que me das"],
    chorus: ["Te doy gracias, te doy gracias", "de mañana y al anochecer", "en lo poco y en lo mucho", "siempre gracias te daré"],
  },
  {
    title: "Ven, Espíritu",
    artist: "Coro Encuentro",
    key: "E",
    bpm: 70,
    tags: "adoración,oración",
    verse: ["Como viento que sopla", "como lluvia en sequedad", "ven y llena este lugar", "ven y danos tu verdad"],
    chorus: ["Ven, Espíritu, ven", "llena todo nuestro ser", "sin ti no podemos más", "ven, Espíritu de paz"],
  },
  {
    title: "Victoria",
    artist: "Banda Horizonte",
    key: "C",
    bpm: 132,
    tags: "celebración,rápida",
    verse: ["La piedra ya fue removida", "la tumba quedó vacía", "la muerte perdió su aguijón", "resucitó, hay vida"],
    chorus: ["Victoria, victoria, cantamos hoy", "venció la muerte, nuestro Señor", "nada nos puede separar", "de su amor y su verdad"],
  },
  {
    title: "Mi lugar seguro",
    artist: "Jóvenes en Marcha",
    key: "F",
    bpm: 74,
    tags: "lenta,confianza",
    verse: ["Cuando todo da vueltas", "cuando no sé qué hacer", "vuelvo a ti como un niño", "y me dejo sostener"],
    chorus: ["Mi lugar seguro eres tú", "en tus brazos encuentro luz", "no me sueltes, no me dejes", "mi lugar seguro eres tú"],
  },
  {
    title: "Pueblos y naciones",
    artist: "Coro Encuentro",
    key: "D",
    bpm: 118,
    tags: "misiones,rápida",
    verse: ["Del norte al sur se escucha", "una nueva canción", "en cada lengua y cada tribu", "se levanta adoración"],
    chorus: ["Pueblos y naciones cantarán", "de tu gloria, de tu bondad", "hasta lo último de la tierra", "tu nombre resonará"],
  },
  {
    title: "Bendito sea",
    artist: "Comunidad Viva",
    key: "G",
    bpm: 88,
    tags: "himno,media",
    verse: ["En la abundancia y en la falta", "en la risa y el dolor", "mi boca no se cansará", "de bendecirte, Señor"],
    chorus: ["Bendito sea tu nombre", "en la tierra y en el mar", "bendito sea tu nombre", "siempre te voy a alabar"],
  },
  {
    title: "Hogar",
    artist: "Banda Horizonte",
    key: "Ab",
    bpm: 66,
    tags: "lenta,adoración",
    verse: ["Anduve tanto tiempo afuera", "buscando dónde descansar", "y al volver me esperabas", "con la puerta sin cerrar"],
    chorus: ["Contigo estoy en casa", "contigo es mi hogar", "no hay lugar en este mundo", "donde quiera más estar"],
  },
];

// ---------- Personas ----------

const PEOPLE = [
  { email: "demo@cancionero.app", name: "Usuario Demo", role: "admin", instrument: "Líder de alabanza" },
  { email: "lucia@cancionero.app", name: "Lucía Fernández", role: "admin", instrument: "Voz principal" },
  { email: "martin@cancionero.app", name: "Martín Gómez", role: "member", instrument: "Guitarra acústica" },
  { email: "sofia@cancionero.app", name: "Sofía Ruiz", role: "member", instrument: "Teclado" },
  { email: "diego@cancionero.app", name: "Diego Herrera", role: "member", instrument: "Batería" },
  { email: "valen@cancionero.app", name: "Valentina Castro", role: "member", instrument: "Coros" },
  { email: "tomas@cancionero.app", name: "Tomás Peralta", role: "member", instrument: "Bajo" },
  { email: "camila@cancionero.app", name: "Camila Ortiz", role: "member", instrument: "Sonido" },
];

// Generador pseudoaleatorio determinístico (mismos datos en cada seed)
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => rand() - 0.5);

async function main() {
  console.log("🧹 Limpiando base de datos…");
  await db.$transaction([
    db.notification.deleteMany(),
    db.pushSubscription.deleteMany(),
    db.channelReadState.deleteMany(),
    db.message.deleteMany(),
    db.channel.deleteMany(),
    db.eventParticipant.deleteMany(),
    db.setlistItem.deleteMany(),
    db.event.deleteMany(),
    db.songFavorite.deleteMany(),
    db.song.deleteMany(),
    db.invite.deleteMany(),
    db.membership.deleteMany(),
    db.team.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("👥 Usuarios y equipo…");
  const users = await Promise.all(
    PEOPLE.map((p) =>
      db.user.create({
        data: {
          email: p.email,
          name: p.name,
          emailVerified: new Date(),
          image: p.email.startsWith("demo") ? null : `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(p.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`,
        },
      }),
    ),
  );
  const demo = users[0];

  const team = await db.team.create({ data: { name: "Alabanza Central" } });
  await db.membership.createMany({
    data: users.map((u, i) => ({
      userId: u.id,
      teamId: team.id,
      role: PEOPLE[i].role,
      instrument: PEOPLE[i].instrument,
      joinedAt: subDays(new Date(), 120 - i * 10),
    })),
  });
  await db.user.updateMany({ data: { currentTeamId: team.id } });
  await db.invite.create({ data: { teamId: team.id, createdById: demo.id, token: randomBytes(18).toString("base64url") } });

  // Segundo equipo (para probar el cambio de equipo)
  const team2 = await db.team.create({ data: { name: "Banda Horizonte" } });
  await db.membership.createMany({
    data: [
      { userId: demo.id, teamId: team2.id, role: "member", instrument: "Guitarra eléctrica" },
      { userId: users[2].id, teamId: team2.id, role: "admin", instrument: "Voz principal" },
    ],
  });
  await db.channel.create({ data: { teamId: team2.id, type: "team" } });

  console.log("🎵 Canciones…");
  const songs: Song[] = [];
  for (const s of SONGS) {
    songs.push(
      await db.song.create({
        data: { teamId: team.id, title: s.title, artist: s.artist, key: s.key, bpm: s.bpm, tags: s.tags, chordSheet: buildSheet(s) },
      }),
    );
  }
  await db.songFavorite.createMany({
    data: [0, 2, 4, 8].map((i) => ({ userId: demo.id, songId: songs[i].id })),
  });
  await db.songFavorite.createMany({
    data: [1, 5, 10].map((i) => ({ userId: users[1].id, songId: songs[i].id })),
  });

  console.log("📅 Eventos…");
  const teamChannel = await db.channel.create({ data: { teamId: team.id, type: "team" } });
  const at = (d: Date, h: number, m = 0) => setMinutes(setHours(startOfDay(d), h), m);

  // Domingos pasados (8), ensayos de jueves pasados (6), y futuros
  const firstUpcomingSunday = nextSunday(new Date());
  const eventsSpec: { title: string; date: Date; template: string; location: string }[] = [];
  for (let w = 8; w >= 1; w--)
    eventsSpec.push({ title: "Servicio dominical", date: at(subDays(firstUpcomingSunday, 7 * w), 10), template: "sunday_service", location: "Templo principal" });
  for (let w = 6; w >= 1; w--)
    eventsSpec.push({ title: "Ensayo general", date: at(subDays(nextThursday(new Date()), 7 * w), 19, 30), template: "rehearsal", location: "Sala de ensayo" });
  eventsSpec.push(
    { title: "Ensayo general", date: at(nextThursday(new Date()), 19, 30), template: "rehearsal", location: "Sala de ensayo" },
    { title: "Servicio dominical", date: at(firstUpcomingSunday, 10), template: "sunday_service", location: "Templo principal" },
    { title: "Servicio dominical", date: at(addDays(firstUpcomingSunday, 7), 10), template: "sunday_service", location: "Templo principal" },
    { title: "Noche de adoración", date: at(addDays(firstUpcomingSunday, 12), 20), template: "concert", location: "Auditorio" },
    { title: "Concierto de Navidad", date: at(addDays(firstUpcomingSunday, 40), 20), template: "concert", location: "Plaza central" },
  );

  const MOMENTS: Record<string, { title: string; at: number; duration: number }[]> = {
    sunday_service: [
      { title: "Bienvenida", at: 0, duration: 5 },
      { title: "Oración", at: 3, duration: 5 },
      { title: "Anuncios", at: 4, duration: 5 },
      { title: "Ofrenda", at: 5, duration: 5 },
      { title: "Prédica", at: 7, duration: 40 },
    ],
    rehearsal: [{ title: "Devocional", at: 0, duration: 10 }],
    concert: [
      { title: "Apertura", at: 0, duration: 5 },
      { title: "Intermedio", at: 4, duration: 15 },
    ],
  };
  const SONG_COUNT: Record<string, number> = { sunday_service: 5, rehearsal: 4, concert: 7 };
  const now = new Date();

  for (const spec of eventsSpec) {
    const past = spec.date < now;
    const farFuture = spec.date > addDays(now, 20);
    const event = await db.event.create({
      data: {
        teamId: team.id,
        title: spec.title,
        date: spec.date,
        endDate: addDays(spec.date, 0),
        template: spec.template,
        location: spec.location,
        notes: spec.template === "rehearsal" ? "Traer las partes impresas. Repasamos transiciones." : null,
      },
    });

    // Setlist: canciones + momentos intercalados
    const chosen = farFuture ? shuffle(songs).slice(0, 2) : shuffle(songs).slice(0, SONG_COUNT[spec.template]);
    const items: { type: string; songId?: string; title?: string; key?: string | null; durationMin?: number; notes?: string }[] =
      chosen.map((s) => ({
        type: "song",
        songId: s.id,
        key: rand() < 0.2 ? pick(["G", "A", "D", "E", "C"]) : s.key,
        durationMin: 5,
        notes: rand() < 0.25 ? pick(["Empieza solo piano", "Repetir coro 2 veces", "Final a capella", "Subir medio tono en el último coro"]) : undefined,
      }));
    for (const m of MOMENTS[spec.template] ?? []) {
      items.splice(Math.min(m.at, items.length), 0, { type: "moment", title: m.title, durationMin: m.duration });
    }
    await db.setlistItem.createMany({
      data: items.map((it, order) => ({ eventId: event.id, order, ...it })),
    });

    // Participantes: demo casi siempre + 4-6 personas
    const crew = [demo, ...shuffle(users.slice(1)).slice(0, 4 + Math.floor(rand() * 3))];
    await db.eventParticipant.createMany({
      data: crew.map((u) => {
        const idx = users.indexOf(u);
        const status = past
          ? rand() < 0.88
            ? "confirmed"
            : "declined"
          : u.id === demo.id
            ? "pending"
            : pick(["confirmed", "confirmed", "pending", "declined"]);
        return {
          eventId: event.id,
          userId: u.id,
          role: PEOPLE[idx].instrument,
          status,
          respondedAt: status === "pending" ? null : subDays(spec.date, 2),
        };
      }),
    });

    // Canal del evento (solo para los próximos y los 2 últimos)
    if (!past || spec.date > subDays(now, 10)) {
      const ch = await db.channel.create({ data: { teamId: team.id, type: "event", eventId: event.id } });
      const lines = [
        [users[1], "¿Hacemos la segunda canción un tono más abajo?"],
        [users[3], "Dale, yo lo paso en el teclado 👍"],
        [users[4], "Llego 15 min antes para armar la batería"],
        [users[7], "Prueba de sonido a las 9:00, no se olviden los in-ears"],
      ] as const;
      await db.message.createMany({
        data: lines.slice(0, past ? 2 : 4).map(([u, body], i) => ({
          channelId: ch.id,
          userId: u.id,
          body,
          createdAt: subMinutes(past ? spec.date : now, (lines.length - i) * 37),
        })),
      });
      if (past) await db.channelReadState.create({ data: { userId: demo.id, channelId: ch.id, lastReadAt: now } });
    }
  }

  console.log("💬 Chat del equipo…");
  const teamMessages: [number, string][] = [
    [1, "¡Hola equipo! Bienvenidos al chat general 🙌"],
    [2, "¿Alguien tiene la hoja de acordes de Corona de luz en Bb?"],
    [0, "Ya está cargada en Canciones, con transposición incluida"],
    [5, "Genial, gracias!"],
    [6, "Este domingo no llego al ensayo previo, aviso"],
    [3, "Subí las notas del puente a la canción Hogar"],
    [1, "Recuerden confirmar asistencia en los eventos de este mes"],
    [4, "Confirmado el jueves 🥁"],
  ];
  await db.message.createMany({
    data: teamMessages.map(([u, body], i) => ({
      channelId: teamChannel.id,
      userId: users[u].id,
      body,
      createdAt: subMinutes(now, (teamMessages.length - i) * 95),
    })),
  });
  // El demo leyó hasta el 5to mensaje: quedan 3 sin leer
  await db.channelReadState.create({
    data: { userId: demo.id, channelId: teamChannel.id, lastReadAt: subMinutes(now, 3 * 95 + 10) },
  });

  console.log("🔔 Notificaciones…");
  await db.notification.createMany({
    data: [
      { userId: demo.id, type: "event_invite", title: "Te asignaron a Servicio dominical", body: "Líder de alabanza", link: "/eventos", createdAt: subMinutes(now, 30) },
      { userId: demo.id, type: "event_updated", title: "Lucía Fernández actualizó el setlist", body: "Noche de adoración", link: "/eventos", createdAt: subMinutes(now, 180) },
      { userId: demo.id, type: "member_joined", title: "Camila Ortiz se unió al equipo", link: "/equipo", createdAt: subDays(now, 2), readAt: subDays(now, 1) },
      { userId: demo.id, type: "message", title: "Nuevo mensaje en #General", body: "Recuerden confirmar asistencia…", link: "/chats", createdAt: subDays(now, 3), readAt: subDays(now, 3) },
    ],
  });

  const counts = await Promise.all([db.user.count(), db.song.count(), db.event.count(), db.message.count()]);
  console.log(`✅ Listo: ${counts[0]} usuarios, ${counts[1]} canciones, ${counts[2]} eventos, ${counts[3]} mensajes.`);
  console.log("   Entrá con el botón «Entrar como demo» (demo@cancionero.app).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
