package com.clubicode.mmomarocback.dto.response;

import com.clubicode.mmomarocback.enums.PropertyStatus;
import com.clubicode.mmomarocback.enums.PropertyType;
import com.clubicode.mmomarocback.enums.Purpose;
import com.clubicode.mmomarocback.enums.SubPurpose;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {

    private Long id;
    private String title;
    private PropertyType type;
    private Purpose purpose;
    private SubPurpose subPurpose;
    private String city;
    private String neighborhood;
    private Double price;
    private Double area;
    private Integer rooms;
    private Integer bathrooms;
    private Integer floor;
    private Boolean parking;
    private Boolean elevator;
    private Boolean furnished;
    private Boolean featured;
    private PropertyStatus status;
    private String description;
    private Long views;
    private LocalDateTime createdAt;
    private LocalDateTime statusChangedAt;
    private List<PropertyImageResponse> images;
    private List<String> features;
    private AgentSummaryResponse agent;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyImageResponse {
        private Long id;
        private String url;
        private Boolean isMain;
        private Integer displayOrder;
    }
}
