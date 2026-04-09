package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.CreateAgentRequest;
import com.clubicode.mmomarocback.dto.request.UpdateAgentRequest;
import com.clubicode.mmomarocback.dto.request.UpdateProfileRequest;
import com.clubicode.mmomarocback.dto.response.AgentResponse;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.service.IAgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final IAgentService agentService;

    @GetMapping
    public ResponseEntity<List<AgentResponse>> getAllAgents(
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(agentService.getAllAgents(city));
    }

    /** Admin-only: returns ALL agents including inactive — no status filter */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgentResponse>> getAllAgentsAdmin() {
        return ResponseEntity.ok(agentService.getAllAgentsAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgentResponse> getAgentById(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.getAgentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> createAgent(@Valid @RequestBody CreateAgentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.createAgent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> updateAgent(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateAgentRequest request) {
        return ResponseEntity.ok(agentService.updateAgent(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.toggleStatus(id));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id) {
        agentService.resetAgentPassword(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/profile")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<AgentResponse> updateMyProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(agentService.updateMyProfile(currentUser, request));
    }
}
