package com.clubicode.mmomarocback.dto.request;

import com.clubicode.mmomarocback.enums.PropertyType;
import com.clubicode.mmomarocback.enums.Purpose;
import com.clubicode.mmomarocback.enums.SubPurpose;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePropertyRequest {

    private String title;
    private PropertyType type;
    private Purpose purpose;
    private SubPurpose subPurpose;
    private String city;
    private String neighborhood;

    @Positive(message = "Price must be positive")
    private Double price;

    private Double area;
    private Integer rooms;
    private Integer bathrooms;
    private Integer floor;

    private Boolean parking;
    private Boolean elevator;
    private Boolean furnished;
    private Boolean featured;

    private String description;
    private List<String> features;
    private List<CreatePropertyRequest.ImageRequest> images;
}
