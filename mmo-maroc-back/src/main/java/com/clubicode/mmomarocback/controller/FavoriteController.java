package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.response.PropertySummaryResponse;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.service.IFavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final IFavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<List<PropertySummaryResponse>> getMyFavorites(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(favoriteService.getMyFavorites(currentUser));
    }

    @PostMapping("/{propertyId}")
    public ResponseEntity<Void> addFavorite(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal User currentUser) {
        favoriteService.addFavorite(propertyId, currentUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal User currentUser) {
        favoriteService.removeFavorite(propertyId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
