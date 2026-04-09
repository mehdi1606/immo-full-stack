package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.request.CreateAgentRequest;
import com.clubicode.mmomarocback.dto.request.UpdateAgentRequest;
import com.clubicode.mmomarocback.dto.request.UpdateProfileRequest;
import com.clubicode.mmomarocback.dto.response.AgentResponse;
import com.clubicode.mmomarocback.dto.response.AgentSummaryResponse;
import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.Role;
import com.clubicode.mmomarocback.enums.UserStatus;
import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.UserRepository;
import com.clubicode.mmomarocback.exception.ConflictException;
import com.clubicode.mmomarocback.exception.ResourceNotFoundException;
import com.clubicode.mmomarocback.service.IAgentService;
import com.clubicode.mmomarocback.service.IEmailService;
import com.clubicode.mmomarocback.service.IFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements IAgentService {

    // ── Secure password generation ────────────────────────────────────────────
    private static final String PWD_UPPER   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String PWD_LOWER   = "abcdefghijklmnopqrstuvwxyz";
    private static final String PWD_DIGITS  = "0123456789";
    private static final String PWD_SPECIAL = "!@#$%&*";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static String generateSecurePassword() {
        String all = PWD_UPPER + PWD_LOWER + PWD_DIGITS + PWD_SPECIAL;
        char[] pwd = new char[12];
        // guarantee at least one of each required class
        pwd[0] = PWD_UPPER.charAt(SECURE_RANDOM.nextInt(PWD_UPPER.length()));
        pwd[1] = PWD_LOWER.charAt(SECURE_RANDOM.nextInt(PWD_LOWER.length()));
        pwd[2] = PWD_DIGITS.charAt(SECURE_RANDOM.nextInt(PWD_DIGITS.length()));
        pwd[3] = PWD_SPECIAL.charAt(SECURE_RANDOM.nextInt(PWD_SPECIAL.length()));
        for (int i = 4; i < 12; i++) pwd[i] = all.charAt(SECURE_RANDOM.nextInt(all.length()));
        // Fisher-Yates shuffle
        for (int i = 11; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char tmp = pwd[i]; pwd[i] = pwd[j]; pwd[j] = tmp;
        }
        return new String(pwd);
    }

    private final AgentRepository    agentRepository;
    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;
    private final IEmailService      emailService;
    private final IFileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public List<AgentResponse> getAllAgents(String city) {
        List<Agent> agents;
        if (city != null && !city.isBlank()) {
            agents = agentRepository.findByUserStatusAndCity(UserStatus.ACTIVE, city);
        } else {
            agents = agentRepository.findByUserStatus(UserStatus.ACTIVE);
        }
        return agents.stream().map(AgentServiceImpl::toAgentResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AgentResponse> getAllAgentsAdmin() {
        return agentRepository.findAllByOrderByIdDesc()
                .stream()
                .map(AgentServiceImpl::toAgentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AgentResponse getAgentById(Long id) {
        Agent agent = findAgentOrThrow(id);
        return toAgentResponse(agent);
    }

    @Override
    @Transactional
    public AgentResponse createAgent(CreateAgentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already exists: " + request.getEmail());
        }

        // Auto-generate a cryptographically secure password when none is provided
        String plainPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : generateSecurePassword();

        // Resolve role — default to AGENT if absent or unrecognised
        Role assignedRole = Role.AGENT;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                assignedRole = Role.valueOf(request.getRole().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                log.warn("Unknown role '{}' in createAgent request — defaulting to AGENT", request.getRole());
            }
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(plainPassword))
                .role(assignedRole)
                .status(UserStatus.ACTIVE)
                .build();

        // Auto-generate an initials SVG avatar when the caller doesn't supply one
        String avatarUrl = (request.getAvatar() != null && !request.getAvatar().isBlank())
                ? request.getAvatar()
                : generateAndStoreInitialsAvatar(request.getName());

        Agent agent = Agent.builder()
                .user(user)
                .phone(request.getPhone())
                .whatsapp(request.getWhatsapp())
                .agency(request.getAgency())
                .city(request.getCity())
                .avatar(avatarUrl)
                .bio(request.getBio())
                .verified(request.getVerified() != null ? request.getVerified() : false)
                .build();

        if (request.getSpecialties() != null) {
            agent.getSpecialties().addAll(request.getSpecialties());
        }

        Agent saved = agentRepository.save(agent);
        log.info("Agent created: {} (id={})", saved.getUser().getEmail(), saved.getId());

        // Send welcome email with credentials
        emailService.sendAgentWelcomeEmail(request.getEmail(), request.getName(), plainPassword);

        return toAgentResponse(saved);
    }

    @Override
    @Transactional
    public AgentResponse updateAgent(Long id, UpdateAgentRequest request) {
        Agent agent = findAgentOrThrow(id);
        User user = agent.getUser();

        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getPhone() != null) agent.setPhone(request.getPhone());
        if (request.getWhatsapp() != null) agent.setWhatsapp(request.getWhatsapp());
        if (request.getAgency() != null) agent.setAgency(request.getAgency());
        if (request.getCity() != null) agent.setCity(request.getCity());
        if (request.getAvatar() != null) {
            String oldAvatar = agent.getAvatar();
            agent.setAvatar(request.getAvatar());
            // Delete old avatar file if it changed and was locally uploaded
            if (oldAvatar != null && !oldAvatar.equals(request.getAvatar())) {
                deleteAvatarQuietly(oldAvatar);
            }
        }
        if (request.getBio() != null) agent.setBio(request.getBio());
        if (request.getRating() != null) agent.setRating(request.getRating());
        if (request.getSold() != null) agent.setSold(request.getSold());
        if (request.getVerified() != null) agent.setVerified(request.getVerified());
        if (request.getSpecialties() != null) {
            agent.getSpecialties().clear();
            agent.getSpecialties().addAll(request.getSpecialties());
        }

        Agent saved = agentRepository.save(agent);
        log.info("Agent updated: id={}", saved.getId());
        return toAgentResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAgent(Long id) {
        Agent agent = findAgentOrThrow(id);
        String avatarUrl = agent.getAvatar();
        agentRepository.delete(agent);
        log.info("Agent deleted: id={}", id);
        if (avatarUrl != null) deleteAvatarQuietly(avatarUrl);
    }

    @Override
    @Transactional
    public AgentResponse toggleStatus(Long id) {
        Agent agent = findAgentOrThrow(id);
        User user = agent.getUser();
        user.setStatus(user.getStatus() == UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE);
        Agent saved = agentRepository.save(agent);
        log.info("Agent status toggled: id={}, newStatus={}", id, saved.getUser().getStatus());
        return toAgentResponse(saved);
    }

    @Override
    @Transactional
    public AgentResponse updateMyProfile(User currentUser, UpdateProfileRequest request) {
        Agent agent = agentRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent profile not found for user: " + currentUser.getId()));

        if (request.getName() != null) agent.getUser().setName(request.getName());
        if (request.getPhone() != null) agent.setPhone(request.getPhone());
        if (request.getWhatsapp() != null) agent.setWhatsapp(request.getWhatsapp());
        if (request.getAgency() != null) agent.setAgency(request.getAgency());
        if (request.getCity() != null) agent.setCity(request.getCity());
        if (request.getAvatar() != null) {
            String oldAvatar = agent.getAvatar();
            agent.setAvatar(request.getAvatar());
            if (oldAvatar != null && !oldAvatar.equals(request.getAvatar())) {
                deleteAvatarQuietly(oldAvatar);
            }
        }
        if (request.getBio() != null) agent.setBio(request.getBio());
        if (request.getSpecialties() != null) {
            agent.getSpecialties().clear();
            agent.getSpecialties().addAll(request.getSpecialties());
        }

        Agent saved = agentRepository.save(agent);
        log.info("Agent profile updated: userId={}", currentUser.getId());
        return toAgentResponse(saved);
    }

    @Override
    @Transactional
    public void resetAgentPassword(Long id) {
        Agent agent = findAgentOrThrow(id);
        String newPassword = generateSecurePassword();
        agent.getUser().setPassword(passwordEncoder.encode(newPassword));
        agentRepository.save(agent);
        emailService.sendPasswordResetEmail(
                agent.getUser().getEmail(),
                agent.getUser().getName(),
                newPassword);
        log.info("Password reset for agent id={}", id);
    }

    private Agent findAgentOrThrow(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", id));
    }

    // ── Avatar generation ─────────────────────────────────────────────────────

    /**
     * Generates an SVG avatar from the agent's initials and stores it in the
     * upload directory.  The background colour is deterministically derived
     * from the name so the same name always produces the same colour.
     *
     * @param name  the agent's full name (e.g. "Mohammed Alami")
     * @return      the public URL of the stored SVG (e.g. "/uploads/uuid.svg")
     */
    private String generateAndStoreInitialsAvatar(String name) {
        // ── Build initials (up to 2 letters) ─────────────────────────────────
        String trimmed = (name == null || name.isBlank()) ? "?" : name.trim();
        String[] parts = trimmed.split("\\s+");
        String initials = parts.length >= 2
                ? String.valueOf(parts[0].charAt(0)).toUpperCase()
                  + String.valueOf(parts[1].charAt(0)).toUpperCase()
                : String.valueOf(parts[0].charAt(0)).toUpperCase();

        // ── Pick background colour from a curated palette ─────────────────────
        String[] palette = {
                "#1a56db", // blue
                "#7e3af2", // purple
                "#0694a2", // teal
                "#e02424", // red
                "#ff5a1f", // orange
                "#0e9f6e", // green
                "#c27803"  // amber
        };
        int idx = Math.abs(trimmed.hashCode()) % palette.length;
        String bg = palette[idx];

        // ── Render SVG ────────────────────────────────────────────────────────
        String svg = String.format(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\">"
                + "<circle cx=\"100\" cy=\"100\" r=\"100\" fill=\"%s\"/>"
                + "<text x=\"100\" y=\"100\" text-anchor=\"middle\" dominant-baseline=\"central\""
                + " fill=\"white\" font-family=\"Arial,sans-serif\" font-size=\"%d\" font-weight=\"700\">%s</text>"
                + "</svg>",
                bg,
                initials.length() == 1 ? 90 : 72,
                initials
        );

        try {
            return fileStorageService.storeGeneratedAvatar(svg);
        } catch (Exception ex) {
            log.warn("Could not store generated avatar for '{}': {}", name, ex.getMessage());
            return null; // non-fatal — agent is created without avatar
        }
    }

    /** Delete avatar from disk only if it is a local upload (not an external URL). */
    private void deleteAvatarQuietly(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        String filename = url.substring("/uploads/".length());
        if (filename.isBlank()) return;
        try {
            fileStorageService.deleteFile(filename);
        } catch (Exception ex) {
            log.warn("Could not delete avatar file '{}': {}", filename, ex.getMessage());
        }
    }

    public static AgentResponse toAgentResponse(Agent agent) {
        User user = agent.getUser();
        return AgentResponse.builder()
                .id(agent.getId())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .phone(agent.getPhone())
                .whatsapp(agent.getWhatsapp())
                .agency(agent.getAgency())
                .city(agent.getCity())
                .avatar(agent.getAvatar())
                .bio(agent.getBio())
                .rating(agent.getRating())
                .sold(agent.getSold())
                .verified(agent.getVerified())
                .specialties(new ArrayList<>(agent.getSpecialties()))
                .listingCount(agent.getProperties().size())
                .build();
    }

    public static AgentSummaryResponse toAgentSummary(Agent agent) {
        User user = agent.getUser();
        return AgentSummaryResponse.builder()
                .id(agent.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(agent.getPhone())
                .agency(agent.getAgency())
                .city(agent.getCity())
                .avatar(agent.getAvatar())
                .rating(agent.getRating())
                .sold(agent.getSold())
                .verified(agent.getVerified())
                .listingCount(agent.getProperties().size())
                .build();
    }
}
