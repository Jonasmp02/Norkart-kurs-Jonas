# Norkart-kurs

Kartapplikasjon jeg har laget i en workshop med [Norkart](https://www.norkart.no/) høsten 2026. Utgangspunktet var Norkarts [webkurs i React](https://github.com/Norkart/norkart-webkurs-React): en React-app med et MapLibre-kart og et sett oppgaver basert på Norkarts API-er. Jeg løste flere av oppgavene og bygde videre med egne funksjoner.

**Teknologi:** React 19 · TypeScript · Vite · MapLibre GL · Material UI · Norkarts API-er (kart, adressesøk, høyde, bygninger og ruteberegning)

## Kursoppgaver jeg har løst

| Oppgave | Hva jeg gjorde |
|---|---|
| **1. Høyde i kartet** | Klikk i kartet viser høyde over havet og koordinater i et eget panel |
| **2. Adressesøk** | Søkefelt i toppbaren med forslag mens du skriver. Kartet flyr til valgt adresse og setter en markør |
| **3. Bygninger** | Viser omrisset av bygningen du klikker på, og bygningsinformasjon: bygningsnummer, type, status, næringsgruppe, byggeår, SEFRAK og kulturminne |
| **5. Kjørerute** | Implementerte kallet mot Norkarts ruteberegner, tegner raskeste rute i kartet og viser kjøretid og avstand (ekstraoppgaven med `CostList`) |

## Egne utvidelser

### 🧭 Ruteplanlegger
- Velg **Fra** og **Til** med adressesøk, din egen posisjon eller klikk i kartet
- Legg til **stopp underveis**, bytt retning eller nullstill
- Start, mål og stopp vises som markører (A, B og nummererte stopp), og kartet zoomer slik at hele ruten vises
- Søker du opp en adresse uten å åpne planleggeren, tegnes ruten fra der du er og dit automatisk

### 🚧 Veiarbeid
- Marker veiarbeid som et **sted** (1 punkt), en **strekning** (2 punkter) eller et **område** (3 eller flere punkter), med egen beskrivelse
- Vises med et varselskilt og en kort beskrivelse. Skiltet skalerer med zoom, og teksten skjules når du zoomer langt ut
- Lagres i nettleseren (`localStorage`), og kan åpnes og slettes igjen

### 📍 Min posisjon
- Egen knapp som henter posisjonen din fra nettleseren og viser den som en blå, pulserende sirkel
- Tydelige feilmeldinger hvis posisjon ikke er tillatt eller ikke kan hentes

### 🗺️ Bakgrunnskart
- Bytt mellom Norkarts kartstiler: standard, gråtoner, mørkt kart, flyfoto, hybrid m.m.

### 🎉 Easter egg
- Søk opp en adresse med «67» i 😉

## Kjør prosjektet lokalt

Krever [Node.js](https://nodejs.org/) og en API-nøkkel fra Norkart.

```bash
npm install
cp .env.example .env   # legg inn API-nøkkelen din i .env
npm run dev
```

Åpne http://localhost:5173/. Posisjon virker bare på `localhost` eller over `https`.

> `.env` er lagt i `.gitignore`, så API-nøkkelen aldri havner i repoet.

## Prosjektstruktur

```
src/
├── api/              # Kall mot Norkarts API-er (adresser, høyde, bygninger, rute …)
└── components/
    ├── MapLibreMap.tsx     # Kartet og høyde-/bygningspanelet
    ├── SearchBar.tsx       # Adressesøk
    ├── BuildingInfo.tsx    # Bygningsinformasjon
    ├── BasemapSelector.tsx # Valg av bakgrunnskart
    ├── Route.tsx           # Tegner kjørerute, tid og avstand
    ├── RoutePlanner.tsx    # Ruteplanlegger med Fra/Til og stopp
    ├── Roadworks.tsx       # Veiarbeid
    └── MyLocation.tsx      # Min posisjon
```

## Takk

Takk til Norkart for workshopen, kursmaterialet og tilgang til API-ene.
