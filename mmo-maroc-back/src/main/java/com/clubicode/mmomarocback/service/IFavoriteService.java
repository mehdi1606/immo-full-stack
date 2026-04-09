package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.response.PropertySummaryResponse;
import com.clubicode.mmomarocback.entity.User;

import java.util.List;

public interface IFavoriteService {

    List<PropertySummaryResponse> getMyFavorites(User currentUser);

    void addFavorite(Long propertyId, User currentUser);

    void removeFavorite(Long propertyId, User currentUser);
}
