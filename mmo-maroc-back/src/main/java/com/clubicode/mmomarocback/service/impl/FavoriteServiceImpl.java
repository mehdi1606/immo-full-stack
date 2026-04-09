package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.response.PropertySummaryResponse;
import com.clubicode.mmomarocback.entity.Favorite;
import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.repository.FavoriteRepository;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import com.clubicode.mmomarocback.exception.ResourceNotFoundException;
import com.clubicode.mmomarocback.service.IFavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements IFavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PropertyRepository propertyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PropertySummaryResponse> getMyFavorites(User currentUser) {
        return favoriteRepository.findByUserId(currentUser.getId()).stream()
                .map(fav -> PropertyServiceImpl.toPropertySummary(fav.getProperty()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addFavorite(Long propertyId, User currentUser) {
        if (favoriteRepository.existsByUserIdAndPropertyId(currentUser.getId(), propertyId)) {
            log.debug("Favorite already exists for user={} property={}", currentUser.getId(), propertyId);
            return;
        }

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));

        Favorite favorite = Favorite.builder()
                .userId(currentUser.getId())
                .property(property)
                .build();

        favoriteRepository.save(favorite);
        log.info("Favorite added: userId={}, propertyId={}", currentUser.getId(), propertyId);
    }

    @Override
    @Transactional
    public void removeFavorite(Long propertyId, User currentUser) {
        favoriteRepository.deleteByUserIdAndPropertyId(currentUser.getId(), propertyId);
        log.info("Favorite removed: userId={}, propertyId={}", currentUser.getId(), propertyId);
    }
}
