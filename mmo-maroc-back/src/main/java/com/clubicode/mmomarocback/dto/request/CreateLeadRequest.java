package com.clubicode.mmomarocback.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateLeadRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String email;

    private String message;

    @NotNull(message = "Property ID is required")
    private Long propertyId;
}
