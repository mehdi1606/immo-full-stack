#!/bin/sh
# Fix permissions on the Docker volume mount point.
# Named volumes are owned by root:root on first mount, even if the image
# directory was chown'd to spring. This runs before dropping to spring.
chown -R spring:spring /var/immomaroc/uploads 2>/dev/null || true

# Drop privileges and start the application as the spring user
exec gosu spring java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Djava.security.egd=file:/dev/./urandom \
  -jar /app/app.jar
