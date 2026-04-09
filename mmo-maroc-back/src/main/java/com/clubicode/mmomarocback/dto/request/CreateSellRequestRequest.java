package com.clubicode.mmomarocback.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSellRequestRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "City is required")
    private String city;

    private String propertyType;
    private String purpose;
    private Double price;
    private Double area;
    private Integer rooms;
    private String title;
    private String description;
}
