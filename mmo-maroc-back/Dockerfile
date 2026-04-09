
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

# Install curl (used by Docker healthcheck) + clean apt cache
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user to run the app (security best practice)
RUN groupadd -r spring && useradd -r -g spring -s /bin/false spring

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create the uploads directory with correct ownership
# This path must match UPLOAD_DIR in docker-compose.yml
RUN mkdir -p /var/immomaroc/uploads && \
    chown -R spring:spring /app /var/immomaroc

# Switch to non-root user
USER spring

EXPOSE 8090

# JVM tuning flags for containerised environments:
#   -XX:+UseContainerSupport       → JVM respects Docker memory limits
#   -XX:MaxRAMPercentage=75.0      → use 75% of container RAM for heap
#   -Djava.security.egd=...urandom → faster startup (non-blocking random)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
