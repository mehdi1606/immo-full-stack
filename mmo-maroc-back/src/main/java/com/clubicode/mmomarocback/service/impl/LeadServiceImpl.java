package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.request.CreateLeadRequest;
import com.clubicode.mmomarocback.dto.request.UpdateLeadStatusRequest;
import com.clubicode.mmomarocback.dto.response.LeadResponse;
import com.clubicode.mmomarocback.dto.response.NotificationPayload;
import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.entity.Lead;
import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.LeadStatus;
import com.clubicode.mmomarocback.enums.Role;
import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.LeadRepository;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import com.clubicode.mmomarocback.exception.ForbiddenException;
import com.clubicode.mmomarocback.exception.ResourceNotFoundException;
import com.clubicode.mmomarocback.service.IEmailService;
import com.clubicode.mmomarocback.service.ILeadService;
import com.clubicode.mmomarocback.service.SseNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadServiceImpl implements ILeadService {

    private final LeadRepository leadRepository;
    private final PropertyRepository propertyRepository;
    private final AgentRepository agentRepository;
    private final IEmailService emailService;
    private final SseNotificationService sseNotificationService;

    @Override
    @Transactional
    public LeadResponse createLead(CreateLeadRequest request) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", request.getPropertyId()));

        Agent agent = property.getAgent();

        Lead lead = Lead.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .message(request.getMessage())
                .property(property)
                .agent(agent)
                .build();

        Lead saved = leadRepository.save(lead);
        log.info("Lead created: id={} for property={}", saved.getId(), property.getId());

        emailService.sendLeadNotificationToAgent(saved);

        NotificationPayload notif = new NotificationPayload(
                "LEAD",
                saved.getId(),
                saved.getName(),
                property.getTitle(),
                LocalDateTime.now()
        );

        // Notify all connected admin tabs
        sseNotificationService.broadcast(notif);

        // Notify the specific agent who owns the property (if they are connected)
        if (agent != null && agent.getUser() != null) {
            sseNotificationService.broadcastToAgent(agent.getUser().getId(), notif);
        }

        return toLeadResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeadResponse> getMyLeads(User currentUser, LeadStatus status) {
        Agent agent = agentRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent profile not found"));

        List<Lead> leads;
        if (status != null) {
            leads = leadRepository.findByPropertyAgentIdAndStatus(agent.getId(), status);
        } else {
            leads = leadRepository.findByPropertyAgentId(agent.getId());
        }

        return leads.stream().map(LeadServiceImpl::toLeadResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeadResponse> getAllLeads(LeadStatus status) {
        List<Lead> leads;
        if (status != null) {
            leads = leadRepository.findByStatus(status);
        } else {
            leads = leadRepository.findAllByOrderByCreatedAtDesc();
        }
        return leads.stream().map(LeadServiceImpl::toLeadResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LeadResponse updateLeadStatus(Long id, User currentUser, UpdateLeadStatusRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead", id));

        if (currentUser.getRole() != Role.ADMIN) {
            Agent agent = agentRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Agent profile not found"));
            if (!lead.getAgent().getId().equals(agent.getId())) {
                throw new ForbiddenException("You can only update leads for your own properties");
            }
        }

        lead.setStatus(request.getStatus());
        Lead saved = leadRepository.save(lead);
        log.info("Lead status updated: id={}, status={}", id, saved.getStatus());
        return toLeadResponse(saved);
    }

    public static LeadResponse toLeadResponse(Lead lead) {
        Property property = lead.getProperty();
        Agent agent = lead.getAgent();
        return LeadResponse.builder()
                .id(lead.getId())
                .name(lead.getName())
                .phone(lead.getPhone())
                .email(lead.getEmail())
                .message(lead.getMessage())
                .status(lead.getStatus())
                .createdAt(lead.getCreatedAt())
                .propertyId(property != null ? property.getId() : null)
                .propertyTitle(property != null ? property.getTitle() : null)
                .propertyCity(property != null ? property.getCity() : null)
                .agentId(agent != null ? agent.getId() : null)
                .agentName(agent != null && agent.getUser() != null ? agent.getUser().getName() : null)
                .build();
    }
}
