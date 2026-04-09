package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.CreateLeadRequest;
import com.clubicode.mmomarocback.dto.request.UpdateLeadStatusRequest;
import com.clubicode.mmomarocback.dto.response.LeadResponse;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.LeadStatus;
import com.clubicode.mmomarocback.service.ILeadService;
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
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final ILeadService leadService;

    @PostMapping
    public ResponseEntity<LeadResponse> createLead(@Valid @RequestBody CreateLeadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leadService.createLead(request));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<List<LeadResponse>> getMyLeads(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) LeadStatus status) {
        return ResponseEntity.ok(leadService.getMyLeads(currentUser, status));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LeadResponse>> getAllLeads(
            @RequestParam(required = false) LeadStatus status) {
        return ResponseEntity.ok(leadService.getAllLeads(status));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<LeadResponse> updateLeadStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateLeadStatusRequest request) {
        return ResponseEntity.ok(leadService.updateLeadStatus(id, currentUser, request));
    }
}
