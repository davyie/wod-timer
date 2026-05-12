# WOD Timer — Development Changelog

A record of all features and changes made to the application.

---

## Audio / Sound Effects

**Files changed:**
- `frontend/src/app/core/services/audio.ts` *(new)*
- `frontend/src/app/timer/timer.ts`

### What was added

An `AudioService` built on the Web Audio API generates tones programmatically — no audio files required, works fully offline.

**Sounds:**

| Sound | Trigger | Description |
|---|---|---|
| `playStart()` | Timer begins (after countdown) | 2 short pips + 1 longer higher pip |
| `playFinish()` | Timer auto-completes | 3 pips |
| `playPip()` | Manual stop / EMOM round change | Single pip |
| `playCountdownPip()` | Pre-start countdown + last 3 seconds | Short low blip |

**Sound triggers in the timer:**
- Each second of the 10-second pre-start countdown plays a `countdownPip`
- At 3, 2, 1 seconds remaining in any countdown timer (AMRAP, EMOM, For Time with cap), three countdown blips fire
- On each EMOM round change, a single pip plays
- Manual Stop plays a pip; Reset is silent

---

## 10-Second Pre-Start Countdown

**Files changed:**
- `frontend/src/app/timer/timer.ts`
- `frontend/src/app/timer/timer.html`

### What was added

Clicking **Start** no longer begins the timer immediately. Instead a 10-second countdown runs first:

- `countingDown` and `countdownValue` signals track the countdown state
- A separate `countdownId` interval ticks every second (10 → 1), playing a pip each second
- When it reaches 0, `startTimer()` fires the start sound and begins the actual timer
- The display shows the countdown number and a **"Get Ready!"** banner
- Mode buttons and the Start button are disabled during the countdown
- **Reset** cancels the countdown silently

---

## Dark Mode (Default)

**Files changed:**
- `frontend/src/styles.scss`
- `frontend/src/app/timer/timer.scss`
- `frontend/src/app/history/history.scss`

### Colour palette

| Token | Value | Usage |
|---|---|---|
| Page background | `#0d0d1a` | `body` |
| Surface | `#1e1e32` | Cards, inputs, tables |
| Surface hover | `#252540` | Table row hover, button hover |
| Border | `#3a3a5c` | All borders |
| Text primary | `#d0d0e8` | Body text |
| Text muted | `#8888aa` | Labels, secondary text |
| Accent | `#4f6fff` | Active mode button |
| Success | `#2ecc71` / `#1a3028` | Finished state text / background |

The navbar was already dark (`#1a1a2e`) and required only minor adjustments (bottom border, nav link colours). Action button colours (Start green, Stop red, Save blue) were kept as-is.

---

## Configurable EMOM Round Duration

**Files changed:**
- `frontend/src/app/timer/timer.ts`
- `frontend/src/app/timer/timer.html`

### What was added

EMOM rounds were previously fixed at 60 seconds. The round duration is now fully configurable:

- `emomRoundMinutes = signal(1)` and `emomRoundSeconds = signal(0)` added
- `emomRoundMs = computed(() => minutes * 60000 + seconds * 1000)` drives all timing logic
- `currentRound`, `roundRemainingMs`, `checkSounds`, and `checkAutoFinish` all use `emomRoundMs`
- `configValid` blocks Start if total round duration is 0
- The config UI shows **Rounds** and a **Round Duration** row with `[min] min [sec] sec` inputs on one line
- Minutes min is `0` (allowing e.g. 0 min 30 sec); seconds min `0`, max `59`

---

## Scrollable Number Inputs

**Files changed:**
- `frontend/src/app/shared/scrollable-input.directive.ts` *(new)*
- `frontend/src/app/timer/timer.ts`

### What was added

A `ScrollableInputDirective` attaches to every `input[type="number"]` in the timer template. Scrolling the mouse wheel up increments the value; scrolling down decrements it. Values are clamped to the `min` and `max` attributes on each input.

The directive is standalone and uses `@HostListener('wheel')` to intercept the event, update `input.value`, and dispatch an `input` event so Angular's `ngModel` binding picks up the change.

---

## Favicon & App Name

**Files changed:**
- `frontend/public/favicon.svg` *(new)*
- `frontend/public/favicon.ico` *(deleted)*
- `frontend/src/index.html`
- `frontend/src/app/app.html`

### What was changed

- Browser tab title changed from `Frontend` → `WOD Timer`
- Navbar brand changed from `Timer App` → `WOD Timer`
- `favicon.ico` replaced with `favicon.svg` — a stopwatch icon with:
  - Very dark body (`#0d0d1a`)
  - Pink accents (`#ff4f8f`) on crown, lugs, ring, second hand, and centre dot
  - Muted tick marks (`#555570`)
  - White minute hand (`#d0d0e8`)
- `index.html` now references `favicon.svg` only (`type="image/svg+xml"`)
- Assets are served from `public/` — placing the file in `src/` has no effect

---

## Screen Wake Lock (Prevent Phone Lock)

**Files changed:**
- `frontend/src/app/core/services/wake-lock.ts` *(new)*
- `frontend/src/app/timer/timer.ts`

### What was added

A `WakeLockService` uses the browser [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) to prevent the phone screen from locking while the timer is active.

**Behaviour:**
- Wake lock **acquired** when Start is pressed (at the beginning of the 10-second countdown)
- Wake lock **released** when the timer finishes, Stop is pressed, or Reset is pressed
- If the user switches away mid-workout, the OS releases the lock automatically; when they return, `visibilitychange` triggers a re-acquire
- If the browser does not support the API or the request fails (e.g. battery saver mode), it silently does nothing

**Browser support:** Chrome on Android, Safari iOS 16.4+, most modern mobile browsers.

---

## README

**Files changed:**
- `README.md`

### What was added

Full project README covering:
- Stack table (Angular, Spring Boot, Cosmos DB, Nginx)
- Timer modes and all audio cue behaviour
- Running locally — Docker Compose, direct run, Cosmos DB emulator
- Building — Docker, frontend-only, backend-only
- Deploying to Azure — step-by-step with all CLI commands
- Project structure tree
- Environment variables reference

---

## Azure Deployment (initial — ACI)

**Files changed:**
- `infra/modules/acr.bicep` *(bug fix)*

### Bug fix

`acr.bicep` referenced `registry.loginServer` which is not a top-level property on the ACR resource type. Fixed to `registry.properties.loginServer`.

### Deployment (completed 2026-05-12)

Resources provisioned in **Sweden Central** using Azure Container Instances:

| Resource | Name |
|---|---|
| Resource group | `wod-timer-rg` |
| Container Registry | `timerregistryo4kcms6autlk2.azurecr.io` |
| Cosmos DB | `timer-cosmos-o4kcms6autlk2` (serverless) |
| Container Instance | `timer-app` (frontend :80, backend :8080) |

**Note:** ACI does not scale to zero — replaced by Container Apps (see below).

---

## Migration to Azure Container Apps (Scale to Zero)

**Files changed:**
- `frontend/nginx.conf` → `frontend/nginx.conf.template` *(renamed)*
- `frontend/Dockerfile`
- `docker-compose.yml`
- `infra/modules/aci.bicep` *(deleted)*
- `infra/modules/container-apps.bicep` *(new)*
- `infra/modules/container-app-env.bicep` *(new)*
- `infra/main.bicep`

### Why

ACI runs continuously regardless of traffic. Azure Container Apps supports `minReplicas: 0`, scaling to zero when idle and billing only for active requests.

### What changed

**nginx — configurable backend URL**

`nginx.conf` was renamed to `nginx.conf.template` and the hardcoded `http://localhost:8080` proxy target replaced with `${BACKEND_URL}`. The Dockerfile now runs `envsubst '$BACKEND_URL'` at container startup to write the final config. Single-quoting `'$BACKEND_URL'` in the shell command ensures only that variable is substituted — nginx's own variables (`$uri`, `$host`, etc.) are left untouched.

`docker-compose.yml` sets `BACKEND_URL=http://backend:8080` (Docker Compose service name). Container Apps sets it to `http://timer-backend` (internal DNS within the environment).

**New Bicep modules**

| Module | Purpose |
|---|---|
| `container-app-env.bicep` | Log Analytics workspace + Container Apps Environment |
| `container-apps.bicep` | Backend app (internal ingress, port 8080) + Frontend app (external HTTPS ingress, port 80) |

Both apps are configured with `minReplicas: 0` and `maxReplicas: 2`. The backend has **internal** ingress so it is not publicly exposed — only the frontend's Nginx proxy can reach it. The frontend has **external** ingress and receives a public HTTPS URL.

The Log Analytics workspace is created inside `container-app-env.bicep` rather than as a separate module to avoid exposing the workspace key as a Bicep output (which would violate the `outputs-should-not-contain-secrets` lint rule).

**Updated `main.bicep`**

```
cosmos → containerAppEnv → containerApps
```

Replaces the old `aci` module reference.

### Deployment steps

```bash
# 1. Create resource group (if not already created)
az group create --name wod-timer-rg --location swedencentral

# 2. Deploy ACR
az deployment group create \
  --resource-group wod-timer-rg \
  --template-file infra/modules/acr.bicep \
  --parameters location=swedencentral

# 3. Build and push images
ACR_NAME=$(az acr list --resource-group wod-timer-rg --query '[0].name' -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
az acr login --name $ACR_NAME

docker build -t $ACR_LOGIN_SERVER/timer-frontend:latest ./frontend
docker build -t $ACR_LOGIN_SERVER/timer-backend:latest ./backend/timer-backend
docker push $ACR_LOGIN_SERVER/timer-frontend:latest
docker push $ACR_LOGIN_SERVER/timer-backend:latest

# 4. Deploy Cosmos DB and retrieve key
az deployment group create \
  --resource-group wod-timer-rg \
  --template-file infra/modules/cosmos.bicep \
  --parameters location=swedencentral

COSMOS_ACCOUNT=$(az cosmosdb list --resource-group wod-timer-rg --query '[0].name' -o tsv)
COSMOS_KEY=$(az cosmosdb keys list \
  --name $COSMOS_ACCOUNT \
  --resource-group wod-timer-rg \
  --query primaryMasterKey -o tsv)

# 5. Deploy full stack (Container Apps + Log Analytics + Cosmos idempotent)
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
