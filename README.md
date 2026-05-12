# WOD Timer

A CrossFit workout timer with support for multiple timer modes, audio cues, and session history.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17+, TypeScript, SCSS |
| Backend | Spring Boot 3, Java 21 |
| Database | Azure Cosmos DB |
| Serving | Nginx (production frontend) |

---

## Timer Modes

| Mode | Description |
|---|---|
| **Stopwatch** | Counts up with centisecond precision |
| **AMRAP** | Counts down from a configured duration |
| **EMOM** | Counts down per round; configurable rounds, minutes, and seconds per round |
| **For Time** | Counts up with an optional time cap |

### Audio Cues

- **Start** — 2 short pips + 1 long pip after the 10-second pre-start countdown
- **Pre-start countdown** — pip each second (10 → 1)
- **Last 3 seconds** — 3 blips before any countdown timer ends
- **EMOM round change** — single pip at the start of each new round
- **Manual stop** — single pip
- **Auto-finish** — 3 pips

---

## Running Locally

### Option 1 — Docker Compose (recommended)

Requires Docker and a Cosmos DB connection.

```bash
export COSMOS_ENDPOINT=<your-endpoint>
export COSMOS_KEY=<your-key>
export COSMOS_DATABASE=timer-db   # optional, this is the default

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend | http://localhost:8080 |

### Option 2 — Run each service directly

**Backend** — requires Java 21 and Maven:

```bash
cd backend/timer-backend
COSMOS_ENDPOINT=<your-endpoint> COSMOS_KEY=<your-key> ./mvnw spring-boot:run
```

**Frontend** — requires Node.js 20:

```bash
cd frontend
npm install
npm start        # ng serve — http://localhost:4200
```

### Cosmos DB Emulator

To run without an Azure account:

```bash
docker run -d -p 8081:8081 -p 10251-10255:10251-10255 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

Then set:

```bash
export COSMOS_ENDPOINT=https://localhost:8081
export COSMOS_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b5MS3e4fqn8pvI/IcrberBAejpSkWg==
```

---

## Building

### Docker (builds both services)

```bash
docker compose build
```

### Frontend only

```bash
cd frontend
npm run build                              # development
npm run build -- --configuration production  # production (outputs to dist/frontend/browser/)
```

### Backend only

```bash
cd backend/timer-backend
./mvnw package -DskipTests               # outputs to target/*.jar
java -jar target/timer-backend-0.0.1-SNAPSHOT.jar
```

---

## Project Structure

```
wod-timer/
├── frontend/               # Angular app
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/services/   # AudioService, SessionService
│   │   │   ├── shared/          # ScrollableInputDirective
│   │   │   ├── timer/           # Timer component
│   │   │   └── history/         # Session history component
│   │   ├── styles.scss          # Global dark theme
│   │   └── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── Dockerfile
├── backend/
│   └── timer-backend/      # Spring Boot app
│       └── src/main/java/com/timerapp/
│           ├── controller/
│           ├── model/
│           └── repository/
└── docker-compose.yml
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `COSMOS_ENDPOINT` | Yes | — | Azure Cosmos DB endpoint URL |
| `COSMOS_KEY` | Yes | — | Azure Cosmos DB primary key |
| `COSMOS_DATABASE` | No | `timer-db` | Database name |
