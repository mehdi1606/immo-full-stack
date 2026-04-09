package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.CreatePropertyRequest;
import com.clubicode.mmomarocback.dto.request.UpdatePropertyRequest;
import com.clubicode.mmomarocback.dto.request.UpdatePropertyStatusRequest;
import com.clubicode.mmomarocback.dto.response.PropertyResponse;
import com.clubicode.mmomarocback.dto.response.PropertySummaryResponse;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.PropertyStatus;
import com.clubicode.mmomarocback.enums.PropertyType;
import com.clubicode.mmomarocback.enums.Purpose;
import com.clubicode.mmomarocback.enums.SubPurpose;
import com.clubicode.mmomarocback.service.IPropertyService;
import com.clubicode.mmomarocback.util.PropertyTranslationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final IPropertyService propertyService;
    private final PropertyTranslationHelper translationHelper;

    // ─────────────────────────────────────────────────────────────────────────
    // Translation is AUTOMATIC on all GET endpoints.
    //
    // How to use from frontend / Postman:
    //   ?lang=ar          → all text fields returned in Arabic
    //   ?lang=en          → all text fields returned in English
    //   no param          → French original (fastest, no translation)
    //   Accept-Language header is also supported as fallback
    //
    // First request: translates via Lingva/MyMemory → saves to DB
    // Any repeat:    returns from Caffeine cache (no HTTP call, sub-millisecond)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<PropertySummaryResponse>> searchProperties(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) Purpose purpose,
            @RequestParam(required = false) PropertyStatus status,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minRooms,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) SubPurpose subPurpose,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String lang,
            @RequestHeader(value = "Accept-Language", required = false) String acceptLang) {

        String targetLang = translationHelper.resolveLang(lang, acceptLang);
        Page<PropertySummaryResponse> result = propertyService.searchProperties(
                page, size, city, type, purpose, subPurpose, status, minPrice, maxPrice, minRooms, q, sort);
        return ResponseEntity.ok(translationHelper.apply(result, targetLang));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getPropertyById(
            @PathVariable Long id,
            @RequestParam(required = false) String lang,
            @RequestHeader(value = "Accept-Language", required = false) String acceptLang) {

        String targetLang = translationHelper.resolveLang(lang, acceptLang);
        PropertyResponse response = propertyService.getPropertyById(id);
        return ResponseEntity.ok(translationHelper.apply(response, targetLang));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<PropertySummaryResponse>> getFeaturedProperties(
            @RequestParam(required = false) String lang,
            @RequestHeader(value = "Accept-Language", required = false) String acceptLang) {

        String targetLang = translationHelper.resolveLang(lang, acceptLang);
        List<PropertySummaryResponse> result = propertyService.getFeaturedProperties();
        return ResponseEntity.ok(translationHelper.apply(result, targetLang));
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<PropertySummaryResponse>> getPropertiesByAgent(
            @PathVariable Long agentId,
            @RequestParam(required = false) String lang,
            @RequestHeader(value = "Accept-Language", required = false) String acceptLang) {

        String targetLang = translationHelper.resolveLang(lang, acceptLang);
        List<PropertySummaryResponse> result = propertyService.getPropertiesByAgent(agentId);
        return ResponseEntity.ok(translationHelper.apply(result, targetLang));
    }

    @PostMapping
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<PropertyResponse> createProperty(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreatePropertyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(propertyService.createProperty(currentUser, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdatePropertyRequest request) {
        return ResponseEntity.ok(propertyService.updateProperty(id, currentUser, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        propertyService.deleteProperty(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<PropertyResponse> updatePropertyStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdatePropertyStatusRequest request) {
        return ResponseEntity.ok(propertyService.updatePropertyStatus(id, currentUser, request));
    }

    /** Admin-only: listings that have been VENDU/LOUE for > 30 days */
    @GetMapping("/admin/expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PropertySummaryResponse>> getExpiredListings() {
        return ResponseEntity.ok(propertyService.getExpiredListings());
    }

    @PatchMapping("/{id}/featured")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<PropertyResponse> toggleFeatured(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(propertyService.toggleFeatured(id, currentUser));
    }
}
