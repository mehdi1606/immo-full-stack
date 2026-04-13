
FROM eclipse-temurin:20-jdk-jammy AS builder
WORKDIR /app

# Install Maven wrapper dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

# Copy Maven wrapper + pom first → better layer caching
# (dependencies only re-downloaded when pom.xml changes)
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

RUN chmod +x mvnw

# Download all dependencies offline (cached layer)
RUN ./mvnw dependency:go-offline -q

# Copy source and build the fat JAR
COPY src src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
# eclipse-temurin:20-jre-jammy = Ubuntu 22.04 + JRE only (smaller than JDK)
FROM eclipse-temurin:20-jre-jammy
WORKDIR /app

# Install curl (healthcheck) + gosu (privilege drop in entrypoint)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gosu && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user to run the app (security best practice)
RUN groupadd -r spring && useradd -r -g spring -s /bin/false spring

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create the uploads directory with correct ownership
# This path must match UPLOAD_DIR in docker-compose.yml
RUN mkdir -p /var/immomaroc/uploads && \
    chown -R spring:spring /app /var/immomaroc

EXPOSE 8090

# entrypoint.sh runs as root, fixes volume permissions, then drops to spring via gosu
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
