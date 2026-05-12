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

## Deploying to Azure

The `infra/` directory contains Bicep templates that provision:
- **Azure Container Registry (ACR)** — stores Docker images
- **Azure Cosmos DB** — serverless, with the `timer-db` database and `sessions` container pre-created
- **Azure Container Instances (ACI)** — runs the frontend and backend containers

### Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- Docker
- An Azure subscription

### Step 1 — Login and create a resource group

```bash
az login
az account set --subscription <your-subscription-id>
az group create --name wod-timer-rg --location eastus
```

### Step 2 — Deploy ACR and push images

```bash
# Deploy the container registry
az deployment group create \
  --resource-group wod-timer-rg \
  --template-file infra/modules/acr.bicep \
  --parameters location=eastus

# Get registry details
ACR_NAME=$(az acr list --resource-group wod-timer-rg --query '[0].name' -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Build and push images
az acr login --name $ACR_NAME

docker build -t $ACR_LOGIN_SERVER/timer-frontend:latest ./frontend
docker build -t $ACR_LOGIN_SERVER/timer-backend:latest ./backend/timer-backend

docker push $ACR_LOGIN_SERVER/timer-frontend:latest
docker push $ACR_LOGIN_SERVER/timer-backend:latest
```

### Step 3 — Deploy Cosmos DB and get the key

```bash
az deployment group create \
  --resource-group wod-timer-rg \
  --template-file infra/modules/cosmos.bicep \
  --parameters location=eastus

COSMOS_ACCOUNT=$(az cosmosdb list --resource-group wod-timer-rg --query '[0].name' -o tsv)
COSMOS_KEY=$(az cosmosdb keys list \
  --name $COSMOS_ACCOUNT \
  --resource-group wod-timer-rg \
  --query primaryMasterKey -o tsv)
```

### Step 4 — Deploy the full stack

```bash
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)

az deployment group create \
  --resource-group wod-timer-rg \
  --template-file infra/main.bicep \
  --parameters \
    acrLoginServer=$ACR_LOGIN_SERVER \
    acrUsername=$ACR_USERNAME \
    acrPassword=$ACR_PASSWORD \
    cosmosKey=$COSMOS_KEY

# Get the app URL
az deployment group show \
  --resource-group wod-timer-rg \
  --name main \
  --query properties.outputs.appUrl.value -o tsv
```

The app will be available at the URL printed by the last command.

### Updating a deployment

When you push code changes, rebuild and re-push the images then re-run Step 4 with an `imageTag` to avoid stale cached images:

```bash
IMAGE_TAG=$(git rev-parse --short HEAD)

docker build -t $ACR_LOGIN_SERVER/timer-frontend:$IMAGE_TAG ./frontend
docker build -t $ACR_LOGIN_SERVER/timer-backend:$IMAGE_TAG ./backend/timer-backend
docker push $ACR_LOGIN_SERVER/timer-frontend:$IMAGE_TAG
docker push $ACR_LOGIN_SERVER/timer-backend:$IMAGE_TAG

az deployment group create \
  --resource-group wod-timer-rg \
  --template-file infra/main.bicep \
  --parameters \
    acrLoginServer=$ACR_LOGIN_SERVER \
    acrUsername=$ACR_USERNAME \
    acrPassword=$ACR_PASSWORD \
    cosmosKey=$COSMOS_KEY \
    imageTag=$IMAGE_TAG
```

### Tear down

```bash
az group delete --name wod-timer-rg --yes
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
