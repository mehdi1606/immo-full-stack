package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.request.CreatePropertyRequest;
import com.clubicode.mmomarocback.dto.request.UpdatePropertyRequest;
import com.clubicode.mmomarocback.dto.request.UpdatePropertyStatusRequest;
import com.clubicode.mmomarocback.dto.response.PropertyResponse;
import com.clubicode.mmomarocback.dto.response.PropertySummaryResponse;
import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.PropertyImage;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.PropertyStatus;
import com.clubicode.mmomarocback.enums.PropertyType;
import com.clubicode.mmomarocback.enums.Purpose;
import com.clubicode.mmomarocback.enums.Role;
import com.clubicode.mmomarocback.enums.SubPurpose;

import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import com.clubicode.mmomarocback.exception.ForbiddenException;
import com.clubicode.mmomarocback.exception.ResourceNotFoundException;
import com.clubicode.mmomarocback.service.IFileStorageService;
import com.clubicode.mmomarocback.service.IPropertyService;
import com.clubicode.mmomarocback.service.ITranslationService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements IPropertyService {

    private final PropertyRepository  propertyRepository;
    private final AgentRepository     agentRepository;
    private final ITranslationService translationService;
    private final IFileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public Page<PropertySummaryResponse> searchProperties(int page, int size, String city,
                                                          PropertyType type, Purpose purpose,
                                                          SubPurpose subPurpose,
                                                          PropertyStatus status, Double minPrice,
                                                          Double maxPrice, Integer minRooms, String q,
                                                          String sort) {
        Specification<Property> spec = buildSpecification(city, type, purpose, subPurpose, status, minPrice, maxPrice, minRooms, q);
        PageRequest pageRequest = PageRequest.of(page, size, resolveSort(sort));
        return propertyRepository.findAll(spec, pageRequest).map(PropertyServiceImpl::toPropertySummary);
    }

    private Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Order.desc("featured"), Sort.Order.desc("createdAt"));
        }
        return switch (sort) {
            case "price,asc"   -> Sort.by(Sort.Order.asc("price"));
            case "price,desc"  -> Sort.by(Sort.Order.desc("price"));
            case "area,desc"   -> Sort.by(Sort.Order.desc("area"));
            case "views,desc"  -> Sort.by(Sort.Order.desc("views"));
            default            -> Sort.by(Sort.Order.desc("featured"), Sort.Order.desc("createdAt"));
        };
    }

    @Override
    @Transactional
    public PropertyResponse getPropertyById(Long id) {
        Property property = findPropertyOrThrow(id);
        propertyRepository.incrementViews(id);
        property.setViews(property.getViews() + 1);
        return toPropertyResponse(property);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertySummaryResponse> getFeaturedProperties() {
        return propertyRepository.findByFeaturedTrueAndStatus(PropertyStatus.DISPONIBLE)
                .stream()
                .map(PropertyServiceImpl::toPropertySummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertySummaryResponse> getPropertiesByAgent(Long agentId) {
        return propertyRepository.findByAgentId(agentId)
                .stream()
                .sorted(Comparator.comparing(Property::getFeatured, Comparator.reverseOrder())
                        .thenComparing(Property::getCreatedAt, Comparator.reverseOrder()))
                .map(PropertyServiceImpl::toPropertySummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PropertyResponse createProperty(User currentUser, CreatePropertyRequest request) {
        Agent agent = agentRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent profile not found for current user"));

        Property property = Property.builder()
                .title(request.getTitle())
                .type(request.getType())
                .purpose(request.getPurpose())
                .subPurpose(request.getSubPurpose())
                .city(request.getCity())
                .neighborhood(request.getNeighborhood())
                .price(request.getPrice())
                .area(request.getArea())
                .rooms(request.getRooms())
                .bathrooms(request.getBathrooms())
                .floor(request.getFloor())
                .parking(request.getParking() != null ? request.getParking() : false)
                .elevator(request.getElevator() != null ? request.getElevator() : false)
                .furnished(request.getFurnished() != null ? request.getFurnished() : false)
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .description(request.getDescription())
                .agent(agent)
                .build();

        if (request.getFeatures() != null) {
            property.getFeatures().addAll(request.getFeatures());
        }

        if (request.getImages() != null) {
            List<PropertyImage> images = mapImages(request.getImages(), property);
            property.getImages().addAll(images);
        }

        Property saved = propertyRepository.save(property);
        log.info("Property created: id={}, title={}", saved.getId(), saved.getTitle());

        // Pre-translate EN + AR in background so first GET is instant
        translationService.preTranslateProperty(
                saved.getId(), saved.getTitle(), saved.getDescription(),
                saved.getCity(), saved.getNeighborhood(), new ArrayList<>(saved.getFeatures()));

        return toPropertyResponse(saved);
    }

    @Override
    @Transactional
    public PropertyResponse updateProperty(Long id, User currentUser, UpdatePropertyRequest request) {
        Property property = findPropertyOrThrow(id);
        checkOwnership(property, currentUser);

        if (request.getTitle() != null) property.setTitle(request.getTitle());
        if (request.getType() != null) property.setType(request.getType());
        if (request.getPurpose() != null) property.setPurpose(request.getPurpose());
        if (request.getSubPurpose() != null) property.setSubPurpose(request.getSubPurpose());
        if (request.getCity() != null) property.setCity(request.getCity());
        if (request.getNeighborhood() != null) property.setNeighborhood(request.getNeighborhood());
        if (request.getPrice() != null) property.setPrice(request.getPrice());
        if (request.getArea() != null) property.setArea(request.getArea());
        if (request.getRooms() != null) property.setRooms(request.getRooms());
        if (request.getBathrooms() != null) property.setBathrooms(request.getBathrooms());
        if (request.getFloor() != null) property.setFloor(request.getFloor());
        if (request.getParking() != null) property.setParking(request.getParking());
        if (request.getElevator() != null) property.setElevator(request.getElevator());
        if (request.getFurnished() != null) property.setFurnished(request.getFurnished());
        if (request.getFeatured() != null) property.setFeatured(request.getFeatured());
        if (request.getDescription() != null) property.setDescription(request.getDescription());

        if (request.getFeatures() != null) {
            property.getFeatures().clear();
            property.getFeatures().addAll(request.getFeatures());
        }

        if (request.getImages() != null) {
            // Collect old URLs before clearing so we can delete removed files
            Set<String> newUrls = request.getImages().stream()
                    .map(CreatePropertyRequest.ImageRequest::getUrl)
                    .collect(java.util.stream.Collectors.toSet());
            List<String> urlsToDelete = property.getImages().stream()
                    .map(PropertyImage::getUrl)
                    .filter(url -> !newUrls.contains(url))
                    .collect(java.util.stream.Collectors.toList());

            property.getImages().clear();
            List<PropertyImage> images = mapImages(request.getImages(), property);
            property.getImages().addAll(images);

            // Delete removed files from disk (after DB is safe)
            urlsToDelete.forEach(url -> deleteFileQuietly(url));
        }

        Property saved = propertyRepository.save(property);
        log.info("Property updated: id={}", saved.getId());

        // Evict old translations + pre-translate fresh in background
        translationService.evictEntityTranslations("property", saved.getId());
        translationService.preTranslateProperty(
                saved.getId(), saved.getTitle(), saved.getDescription(),
                saved.getCity(), saved.getNeighborhood(), new ArrayList<>(saved.getFeatures()));

        return toPropertyResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProperty(Long id, User currentUser) {
        Property property = findPropertyOrThrow(id);
        if (currentUser.getRole() != Role.ADMIN) {
            checkOwnership(property, currentUser);
        }
        // Collect image URLs before cascade-delete removes them from DB
        List<String> imageUrls = property.getImages().stream()
                .map(PropertyImage::getUrl)
                .collect(java.util.stream.Collectors.toList());

        propertyRepository.delete(property);
        log.info("Property deleted: id={}", id);

        // Delete physical image files from disk
        imageUrls.forEach(url -> deleteFileQuietly(url));
    }

    @Override
    @Transactional
    public PropertyResponse updatePropertyStatus(Long id, User currentUser, UpdatePropertyStatusRequest request) {
        Property property = findPropertyOrThrow(id);
        checkOwnership(property, currentUser);
        PropertyStatus newStatus = request.getStatus();
        property.setStatus(newStatus);
        // Record the exact moment the property becomes sold or rented
        if (newStatus == PropertyStatus.VENDU || newStatus == PropertyStatus.LOUE) {
            property.setStatusChangedAt(java.time.LocalDateTime.now());
        } else {
            // Back to DISPONIBLE — clear the timestamp
            property.setStatusChangedAt(null);
        }
        Property saved = propertyRepository.save(property);
        log.info("Property status updated: id={}, status={}", id, saved.getStatus());
        return toPropertyResponse(saved);
    }

    @Override
    @Transactional
    public PropertyResponse toggleFeatured(Long id, User currentUser) {
        Property property = findPropertyOrThrow(id);
        // Agents may only toggle featured on their own properties
        if (currentUser.getRole() == Role.AGENT) {
            checkOwnership(property, currentUser);
        }
        property.setFeatured(!property.getFeatured());
        Property saved = propertyRepository.save(property);
        log.info("Property featured toggled: id={}, featured={}, by userId={}",
                id, saved.getFeatured(), currentUser.getId());
        return toPropertyResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertySummaryResponse> getExpiredListings() {
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now().minusDays(30);
        return propertyRepository.findExpiredListings(threshold)
                .stream()
                .map(PropertyServiceImpl::toPropertySummary)
                .collect(Collectors.toList());
    }

    /** Extract filename from /uploads/xxx.jpg and delete quietly (never throws). */
    private void deleteFileQuietly(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        String filename = url.substring("/uploads/".length());
        if (filename.isBlank()) return;
        try {
            fileStorageService.deleteFile(filename);
        } catch (Exception ex) {
            log.warn("Could not delete file '{}': {}", filename, ex.getMessage());
        }
    }

    private void checkOwnership(Property property, User currentUser) {
        if (!property.getAgent().getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You can only modify your own properties");
        }
    }

    private Property findPropertyOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", id));
    }

    private List<PropertyImage> mapImages(List<CreatePropertyRequest.ImageRequest> requests, Property property) {
        List<PropertyImage> images = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            CreatePropertyRequest.ImageRequest req = requests.get(i);
            images.add(PropertyImage.builder()
                    .url(req.getUrl())
                    .isMain(req.getIsMain() != null ? req.getIsMain() : i == 0)
                    .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : i)
                    .property(property)
                    .build());
        }
        return images;
    }

    private Specification<Property> buildSpecification(String city, PropertyType type, Purpose purpose,
                                                       SubPurpose subPurpose, PropertyStatus status,
                                                       Double minPrice, Double maxPrice,
                                                       Integer minRooms, String q) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.toLowerCase()));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (purpose != null) {
                predicates.add(cb.equal(root.get("purpose"), purpose));
            }
            if (subPurpose != null) {
                predicates.add(cb.equal(root.get("subPurpose"), subPurpose));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (minRooms != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rooms"), minRooms));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("city")), pattern),
                        cb.like(cb.lower(root.get("neighborhood")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static PropertySummaryResponse toPropertySummary(Property property) {
        String mainImage = property.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .map(PropertyImage::getUrl)
                .findFirst()
                .orElse(property.getImages().isEmpty() ? null : property.getImages().get(0).getUrl());

        return PropertySummaryResponse.builder()
                .id(property.getId())
                .title(property.getTitle())
                .type(property.getType())
                .purpose(property.getPurpose())
                .subPurpose(property.getSubPurpose())
                .city(property.getCity())
                .neighborhood(property.getNeighborhood())
                .price(property.getPrice())
                .area(property.getArea())
                .rooms(property.getRooms())
                .bathrooms(property.getBathrooms())
                .featured(property.getFeatured())
                .status(property.getStatus())
                .views(property.getViews())
                .createdAt(property.getCreatedAt())
                .statusChangedAt(property.getStatusChangedAt())
                .mainImageUrl(mainImage)
                .agent(AgentServiceImpl.toAgentSummary(property.getAgent()))
                .build();
    }

    public static PropertyResponse toPropertyResponse(Property property) {
        List<PropertyResponse.PropertyImageResponse> imageResponses = property.getImages().stream()
                .map(img -> PropertyResponse.PropertyImageResponse.builder()
                        .id(img.getId())
                        .url(img.getUrl())
                        .isMain(img.getIsMain())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return PropertyResponse.builder()
                .id(property.getId())
                .title(property.getTitle())
                .type(property.getType())
                .purpose(property.getPurpose())
                .subPurpose(property.getSubPurpose())
                .city(property.getCity())
                .neighborhood(property.getNeighborhood())
                .price(property.getPrice())
                .area(property.getArea())
                .rooms(property.getRooms())
                .bathrooms(property.getBathrooms())
                .floor(property.getFloor())
                .parking(property.getParking())
                .elevator(property.getElevator())
                .furnished(property.getFurnished())
                .featured(property.getFeatured())
                .status(property.getStatus())
                .description(property.getDescription())
                .views(property.getViews())
                .createdAt(property.getCreatedAt())
                .statusChangedAt(property.getStatusChangedAt())
                .images(imageResponses)
                .features(new ArrayList<>(property.getFeatures()))
                .agent(AgentServiceImpl.toAgentSummary(property.getAgent()))
                .build();
    }
}
