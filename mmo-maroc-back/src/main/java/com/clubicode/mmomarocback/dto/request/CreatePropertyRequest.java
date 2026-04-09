package com.clubicode.mmomarocback.dto.request;

import com.clubicode.mmomarocback.enums.PropertyType;
import com.clubicode.mmomarocback.enums.Purpose;
import com.clubicode.mmomarocback.enums.SubPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class CreatePropertyRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Property type is required")
    private PropertyType type;

    @NotNull(message = "Purpose is required")
    private Purpose purpose;

    private SubPurpose subPurpose;

    @NotBlank(message = "City is required")
    private String city;

    private String neighborhood;

    @NotNull(message = "Price is required")
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
    private List<ImageRequest> images;

    @Data
    public static class ImageRequest {
        private String url;
        private Boolean isMain;
        private Integer displayOrder;
    }
}
