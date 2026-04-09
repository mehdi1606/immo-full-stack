package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.AssignSellRequestRequest;
import com.clubicode.mmomarocback.dto.request.CreateSellRequestRequest;
import com.clubicode.mmomarocback.dto.request.UpdateSellRequestStatusRequest;
import com.clubicode.mmomarocback.dto.response.SellRequestResponse;
import com.clubicode.mmomarocback.enums.SellRequestStatus;
import com.clubicode.mmomarocback.service.ISellRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/sell-requests")
@RequiredArgsConstructor
public class SellRequestController {

    private final ISellRequestService sellRequestService;

    @PostMapping
    public ResponseEntity<SellRequestResponse> createSellRequest(
            @Valid @RequestBody CreateSellRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sellRequestService.createSellRequest(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SellRequestResponse>> getAllSellRequests(
            @RequestParam(required = false) SellRequestStatus status) {
        return ResponseEntity.ok(sellRequestService.getAllSellRequests(status));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellRequestResponse> updateSellRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSellRequestStatusRequest request) {
        return ResponseEntity.ok(sellRequestService.updateSellRequestStatus(id, request));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellRequestResponse> assignSellRequest(
            @PathVariable Long id,
            @Valid @RequestBody AssignSellRequestRequest request) {
        return ResponseEntity.ok(sellRequestService.assignSellRequest(id, request));
    }
}
