package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.entity.ContactMessage;
import com.clubicode.mmomarocback.entity.Lead;
import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.SellRequest;
import com.clubicode.mmomarocback.service.IEmailService;

import java.util.List;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.base-url:http://localhost:8090}")
    private String baseUrl;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ─────────────────────────────────────────────
    //  1. Lead notification → Agent
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendLeadNotificationToAgent(Lead lead) {
        try {
            String body = loadTemplate("lead-notification.html")
                    .replace("{{PROPERTY_TITLE}}", lead.getProperty().getTitle())
                    .replace("{{PROPERTY_CITY}}", lead.getProperty().getCity())
                    .replace("{{CLIENT_NAME}}", lead.getName())
                    .replace("{{CLIENT_PHONE}}", lead.getPhone())
                    .replace("{{CLIENT_EMAIL}}", lead.getEmail() != null ? lead.getEmail() : "-")
                    .replace("{{CLIENT_MESSAGE}}", lead.getMessage() != null ? lead.getMessage() : "-")
                    .replace("{{RECEIVED_DATE}}", lead.getCreatedAt().format(DATE_FORMAT));

            send(
                lead.getAgent().getUser().getEmail(),
                "Nouveau message pour votre bien : " + lead.getProperty().getTitle(),
                body
            );

            log.info("Lead notification sent to agent: {}", lead.getAgent().getUser().getEmail());
        } catch (Exception ex) {
            log.error("Failed to send lead notification to agent {}: {}",
                    lead.getAgent().getUser().getEmail(), ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  2. Sell request confirmation → Client
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendSellRequestConfirmationToClient(SellRequest req) {
        try {
            String body = loadTemplate("sell-request-confirmation.html")
                    .replace("{{CLIENT_NAME}}", req.getName())
                    .replace("{{PROPERTY_TYPE}}", req.getPropertyType() != null ? req.getPropertyType() : "Bien immobilier")
                    .replace("{{CITY}}", req.getCity())
                    .replace("{{PURPOSE}}", req.getPurpose() != null ? req.getPurpose() : "-")
                    .replace("{{PRICE}}", req.getPrice() != null ? String.format("%.0f", req.getPrice()) : "N/A");

            send(
                req.getEmail(),
                "IMMO 21 — Votre demande a bien été reçue",
                body
            );

            log.info("Sell request confirmation sent to client: {}", req.getEmail());
        } catch (Exception ex) {
            log.error("Failed to send confirmation email to client {}: {}", req.getEmail(), ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  3. Sell request notification → Admin
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendSellRequestNotificationToAdmin(SellRequest req) {
        try {
            String body = loadTemplate("sell-request-admin.html")
                    .replace("{{CLIENT_NAME}}", req.getName())
                    .replace("{{CLIENT_PHONE}}", req.getPhone())
                    .replace("{{CLIENT_EMAIL}}", req.getEmail())
                    .replace("{{CITY}}", req.getCity())
                    .replace("{{PROPERTY_TYPE}}", req.getPropertyType() != null ? req.getPropertyType() : "-")
                    .replace("{{PURPOSE}}", req.getPurpose() != null ? req.getPurpose() : "-")
                    .replace("{{PRICE}}", req.getPrice() != null ? String.format("%.0f", req.getPrice()) : "-")
                    .replace("{{AREA}}", req.getArea() != null ? String.format("%.0f", req.getArea()) : "-")
                    .replace("{{ROOMS}}", req.getRooms() != null ? req.getRooms().toString() : "-")
                    .replace("{{TITLE}}", req.getTitle() != null ? req.getTitle() : "-")
                    .replace("{{DESCRIPTION}}", req.getDescription() != null ? req.getDescription() : "-")
                    .replace("{{SUBMITTED_DATE}}", req.getCreatedAt().format(DATE_FORMAT));

            send(
                adminEmail,
                "Nouvelle demande — " + req.getName() + " | " + req.getPropertyType() + " " + req.getCity(),
                body
            );

            log.info("Sell request notification sent to admin: {}", adminEmail);
        } catch (Exception ex) {
            log.error("Failed to send sell request notification to admin: {}", ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  4. Welcome email → New agent
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendAgentWelcomeEmail(String email, String name, String password) {
        try {
            String body = loadTemplate("agent-welcome.html")
                    .replace("{{AGENT_NAME}}", name)
                    .replace("{{AGENT_EMAIL}}", email)
                    .replace("{{AGENT_PASSWORD}}", password);

            send(email, "IMMO 21 — Bienvenue ! Vos accès à l'espace agent", body);
            log.info("Welcome email sent to agent: {}", email);
        } catch (Exception ex) {
            log.error("Failed to send welcome email to agent {}: {}", email, ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  5. Contact message notification → Admin
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendContactMessageToAdmin(ContactMessage msg) {
        try {
            String body = loadTemplate("contact-message-admin.html")
                    .replace("{{CLIENT_NAME}}", msg.getName())
                    .replace("{{CLIENT_PHONE}}", msg.getPhone() != null ? msg.getPhone() : "-")
                    .replace("{{CLIENT_EMAIL}}", msg.getEmail())
                    .replace("{{SUBJECT}}", msg.getSubject())
                    .replace("{{MESSAGE}}", msg.getMessage())
                    .replace("{{RECEIVED_DATE}}", msg.getCreatedAt().format(DATE_FORMAT));

            send(
                adminEmail,
                "IMMO 21 — Nouveau message : " + msg.getSubject() + " | " + msg.getName(),
                body
            );

            log.info("Contact message notification sent to admin from {}", msg.getEmail());
        } catch (Exception ex) {
            log.error("Failed to send contact message notification to admin: {}", ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  6. Contact confirmation → Sender
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendContactConfirmationToSender(ContactMessage msg) {
        try {
            String body = loadTemplate("contact-confirmation.html")
                    .replace("{{CLIENT_NAME}}", msg.getName())
                    .replace("{{SUBJECT}}", msg.getSubject());

            send(
                msg.getEmail(),
                "IMMO 21 — Votre message a bien été reçu",
                body
            );

            log.info("Contact confirmation sent to sender: {}", msg.getEmail());
        } catch (Exception ex) {
            log.error("Failed to send contact confirmation to {}: {}", msg.getEmail(), ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  7. Password reset → Agent
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendPasswordResetEmail(String email, String name, String newPassword) {
        try {
            String body = loadTemplate("agent-welcome.html")
                    .replace("{{AGENT_NAME}}", name)
                    .replace("{{AGENT_EMAIL}}", email)
                    .replace("{{AGENT_PASSWORD}}", newPassword);

            send(email, "IMMO 21 — Votre mot de passe a été réinitialisé", body);
            log.info("Password reset email sent to: {}", email);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}: {}", email, ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  8. Expired listings digest → Admin
    // ─────────────────────────────────────────────
    @Override
    @Async
    public void sendExpiredListingsNotificationToAdmin(List<Property> expiredListings) {
        try {
            // Build an HTML table row per expired listing
            StringBuilder rows = new StringBuilder();
            for (Property p : expiredListings) {
                String changedAt = p.getStatusChangedAt() != null
                        ? p.getStatusChangedAt().format(DATE_FORMAT) : "-";
                rows.append("<tr>")
                    .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0'>").append(p.getId()).append("</td>")
                    .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600'>").append(p.getTitle()).append("</td>")
                    .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0'>").append(p.getCity()).append("</td>")
                    .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0'>").append(p.getStatus()).append("</td>")
                    .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0'>").append(changedAt).append("</td>")
                    .append("</tr>");
            }

            String body = loadTemplate("expired-listings-admin.html")
                    .replace("{{COUNT}}", String.valueOf(expiredListings.size()))
                    .replace("{{ROWS}}", rows.toString())
                    .replace("{{CHECK_DATE}}", java.time.LocalDateTime.now().format(DATE_FORMAT));

            send(adminEmail,
                 "IMMO 21 — " + expiredListings.size() + " annonce(s) expirée(s) à traiter",
                 body);
            log.info("Expired listings digest sent to admin ({} listings)", expiredListings.size());
        } catch (Exception ex) {
            log.error("Failed to send expired listings notification: {}", ex.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────
    private static final ClassPathResource LOGO = new ClassPathResource("static/img/logo-navbar.webp");

    private String loadTemplate(String filename) throws IOException {
        ClassPathResource resource = new ClassPathResource("templates/email/" + filename);
        return resource.getContentAsString(StandardCharsets.UTF_8)
            .replace("{{YEAR}}", String.valueOf(java.time.Year.now().getValue()))
            .replace("{{LOGO_URL}}", "cid:logo");
    }

    private void send(String to, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
            message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        if (LOGO.exists()) {
            helper.addInline("logo", LOGO, "image/webp");
        }
        mailSender.send(message);
    }
}
