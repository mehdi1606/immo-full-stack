package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.CreateContactRequest;
import com.clubicode.mmomarocback.dto.response.ContactMessageResponse;
import com.clubicode.mmomarocback.enums.ContactMessageStatus;
import com.clubicode.mmomarocback.service.IContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final IContactService contactService;

    /** Public — anyone can submit a contact message */
    @PostMapping
    public ResponseEntity<ContactMessageResponse> submitMessage(
            @Valid @RequestBody CreateContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contactService.submitMessage(request));
    }

    /** Admin only — view all contact messages */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ContactMessageResponse>> getAllMessages(
            @RequestParam(required = false) ContactMessageStatus status) {
        return ResponseEntity.ok(contactService.getAllMessages(status));
    }

    /** Admin only — mark as LU or REPONDU */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactMessageResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        ContactMessageStatus status = ContactMessageStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(contactService.updateStatus(id, status));
    }
}
