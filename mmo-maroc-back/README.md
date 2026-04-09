# ImmoMaroc — Backend API

Spring Boot 3 REST API for the ImmoMaroc real-estate platform.

---

## Environment Setup

All secrets are injected via environment variables. **No credentials are ever
hardcoded** — the app will refuse to start if a required variable is missing
in the `prod` profile.

### 1 — Local development

```bash
# Copy the template
cp .env.example .env

# Edit .env and fill in your local values (DB password, mail creds, etc.)
# Minimal setup — only these two are needed to send emails locally:
MAIL_USERNAME=houarimehdi7@gmail.com
MAIL_PASSWORD=mcbe wurr ubqp nmsf   # Gmail App Password
```

Load the `.env` file before starting the app:

```bash
# Option A — export manually
export $(grep -v '^#' .env | xargs)
mvn spring-boot:run

# Option B — IntelliJ IDEA
# Run → Edit Configurations → Environment variables → paste the .env content

# Option C — VS Code (with "DotENV" extension)
# The extension auto-loads .env for terminal sessions
```

> **Note:** For local dev you can skip setting `JWT_SECRET`, `DB_PASSWORD`,
> and most other vars — the `application.properties` defaults kick in
> automatically. Only `MAIL_USERNAME` / `MAIL_PASSWORD` have no default.

---

### 2 — Production (VPS / cPanel / Docker)

Set `SPRING_PROFILES_ACTIVE=prod` **first**. This activates
`application-prod.properties` (no defaults — any missing variable crashes the
JVM at startup with a descriptive error).

#### Required variables in production

| Variable | Description |
|---|---|
| `SPRING_PROFILES_ACTIVE` | Must be `prod` |
| `DB_URL` | Full JDBC URL, e.g. `jdbc:postgresql://localhost:5432/immomaroc` |
| `DB_USERNAME` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password (strong, not `0000`) |
| `JWT_SECRET` | ≥ 32 chars — generate with `openssl rand -base64 48` |
| `MAIL_USERNAME` | Gmail address for outgoing mail |
| `MAIL_PASSWORD` | Gmail **App Password** (not your login password) |
| `UPLOAD_DIR` | Absolute path to file storage, e.g. `/var/immomaroc/uploads/` |
| `CORS_ALLOWED_ORIGINS` | Frontend domain(s), e.g. `https://immomaroc.ma` |
| `ADMIN_EMAIL` | Email of the seeded admin account |

#### cPanel (shared hosting)

1. Go to **Software → Setup Python App** (or the Java equivalent).
2. Under **Environment Variables**, add each key-value pair from the table above.
3. Restart the application.

#### Systemd service

```ini
[Service]
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DB_URL=jdbc:postgresql://localhost:5432/immomaroc"
Environment="DB_USERNAME=postgres"
Environment="DB_PASSWORD=YOUR_STRONG_PASSWORD"
Environment="JWT_SECRET=YOUR_OPENSSL_RAND_OUTPUT"
Environment="MAIL_USERNAME=youraddress@gmail.com"
Environment="MAIL_PASSWORD=xxxx xxxx xxxx xxxx"
Environment="UPLOAD_DIR=/var/immomaroc/uploads/"
Environment="CORS_ALLOWED_ORIGINS=https://immomaroc.ma"
Environment="ADMIN_EMAIL=admin@immomaroc.ma"
ExecStart=/usr/bin/java -jar /opt/immomaroc/mmo-maroc-back.jar
```

#### Docker / Docker Compose

```yaml
services:
  api:
    image: immomaroc-api
    env_file: .env          # keep .env on the server, never in the image
    environment:
      SPRING_PROFILES_ACTIVE: prod
```

---

### 3 — Generating a secure JWT secret

```bash
# macOS / Linux
openssl rand -base64 48

# Windows (PowerShell)
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

The output is a 64-character base-64 string — well above the 32-character
(256-bit) minimum required by HS256.

---

### 4 — Gmail App Password

1. Enable **2-Step Verification** on your Google account.
2. Go to <https://myaccount.google.com/apppasswords>.
3. Create a new App Password (select **Mail** + **Other**).
4. Copy the 16-character password (shown as four 4-letter groups).
5. Use it as `MAIL_PASSWORD` — **not** your regular Gmail password.

---

## Running the application

```bash
# Development (uses application.properties defaults)
mvn spring-boot:run

# Production (loads application-prod.properties + secret validation)
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run

# Build JAR
mvn clean package -DskipTests
java -jar target/mmo-maroc-back-*.jar
```

---

## Project structure (key files)

```
src/main/resources/
  application.properties          # Non-secret config + dev defaults
  application-prod.properties     # Production overrides (no defaults)

src/main/java/.../config/
  SecretsValidationConfig.java    # Fail-fast startup validation (@Profile("prod"))
  SecurityConfig.java
  ApplicationConfig.java

.env.example                      # Template — copy to .env locally
.gitignore                        # .env and application-prod.properties are excluded
```
