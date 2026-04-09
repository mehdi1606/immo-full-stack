package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.request.AssignSellRequestRequest;
import com.clubicode.mmomarocback.dto.request.CreateSellRequestRequest;
import com.clubicode.mmomarocback.dto.request.UpdateSellRequestStatusRequest;
import com.clubicode.mmomarocback.dto.response.NotificationPayload;
import com.clubicode.mmomarocback.dto.response.SellRequestResponse;
import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.entity.SellRequest;
import com.clubicode.mmomarocback.enums.SellRequestStatus;
import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.SellRequestRepository;
import com.clubicode.mmomarocback.exception.ResourceNotFoundException;
import com.clubicode.mmomarocback.service.IEmailService;
import com.clubicode.mmomarocback.service.ISellRequestService;
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
public class SellRequestServiceImpl implements ISellRequestService {

    private final SellRequestRepository sellRequestRepository;
    private final AgentRepository agentRepository;
    private final IEmailService emailService;
    private final SseNotificationService sseNotificationService;

    @Override
    @Transactional
    public SellRequestResponse createSellRequest(CreateSellRequestRequest request) {
        SellRequest sellRequest = SellRequest.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .city(request.getCity())
                .propertyType(request.getPropertyType())
                .purpose(request.getPurpose())
                .price(request.getPrice())
                .area(request.getArea())
                .rooms(request.getRooms())
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        SellRequest saved = sellRequestRepository.save(sellRequest);
        log.info("Sell request created: id={} from {}", saved.getId(), saved.getEmail());

        emailService.sendSellRequestConfirmationToClient(saved);
        emailService.sendSellRequestNotificationToAdmin(saved);

        // Push real-time notification to all connected admin tabs
        sseNotificationService.broadcast(new NotificationPayload(
                "SELL_REQUEST",
                saved.getId(),
                saved.getName(),
                saved.getCity(),
                LocalDateTime.now()
        ));

        return toSellRequestResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SellRequestResponse> getAllSellRequests(SellRequestStatus status) {
        List<SellRequest> requests;
        if (status != null) {
            requests = sellRequestRepository.findByStatus(status);
        } else {
            requests = sellRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        return requests.stream().map(SellRequestServiceImpl::toSellRequestResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SellRequestResponse updateSellRequestStatus(Long id, UpdateSellRequestStatusRequest request) {
        SellRequest sellRequest = findOrThrow(id);
        sellRequest.setStatus(request.getStatus());
        SellRequest saved = sellRequestRepository.save(sellRequest);
        log.info("Sell request status updated: id={}, status={}", id, saved.getStatus());
        return toSellRequestResponse(saved);
    }

    @Override
    @Transactional
    public SellRequestResponse assignSellRequest(Long id, AssignSellRequestRequest request) {
        SellRequest sellRequest = findOrThrow(id);
        Agent agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent", request.getAgentId()));

        sellRequest.setAssignedAgent(agent);
        SellRequest saved = sellRequestRepository.save(sellRequest);
        log.info("Sell request assigned: id={}, agentId={}", id, agent.getId());
        return toSellRequestResponse(saved);
    }

    private SellRequest findOrThrow(Long id) {
        return sellRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellRequest", id));
    }

    public static SellRequestResponse toSellRequestResponse(SellRequest req) {
        return SellRequestResponse.builder()
                .id(req.getId())
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .city(req.getCity())
                .propertyType(req.getPropertyType())
                .purpose(req.getPurpose())
                .price(req.getPrice())
                .area(req.getArea())
                .rooms(req.getRooms())
                .title(req.getTitle())
                .description(req.getDescription())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .assignedAgent(req.getAssignedAgent() != null
                        ? AgentServiceImpl.toAgentSummary(req.getAssignedAgent())
                        : null)
                .build();
    }
}
