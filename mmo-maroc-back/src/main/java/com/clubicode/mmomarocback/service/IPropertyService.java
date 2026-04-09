package com.clubicode.mmomarocback.service;

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
import org.springframework.data.domain.Page;

import java.util.List;

public interface IPropertyService {

    Page<PropertySummaryResponse> searchProperties(int page, int size, String city, PropertyType type,
                                                   Purpose purpose, SubPurpose subPurpose,
                                                   PropertyStatus status,
                                                   Double minPrice, Double maxPrice,
                                                   Integer minRooms, String q, String sort);

    PropertyResponse getPropertyById(Long id);

    List<PropertySummaryResponse> getFeaturedProperties();

    List<PropertySummaryResponse> getPropertiesByAgent(Long agentId);

    PropertyResponse createProperty(User currentUser, CreatePropertyRequest request);

    PropertyResponse updateProperty(Long id, User currentUser, UpdatePropertyRequest request);

    void deleteProperty(Long id, User currentUser);

    PropertyResponse updatePropertyStatus(Long id, User currentUser, UpdatePropertyStatusRequest request);

    PropertyResponse toggleFeatured(Long id, User currentUser);

    /** Returns listings that have been VENDU/LOUE for more than 30 days. */
    List<PropertySummaryResponse> getExpiredListings();
}
