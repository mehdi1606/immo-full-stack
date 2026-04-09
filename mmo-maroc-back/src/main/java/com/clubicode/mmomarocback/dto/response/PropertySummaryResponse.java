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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertySummaryResponse {

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
    private Boolean featured;
    private PropertyStatus status;
    private Long views;
    private LocalDateTime createdAt;
    private LocalDateTime statusChangedAt;
    private String mainImageUrl;
    private AgentSummaryResponse agent;
}
