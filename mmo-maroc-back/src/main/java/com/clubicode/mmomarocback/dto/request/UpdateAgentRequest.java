package com.clubicode.mmomarocback.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateAgentRequest {

    private String name;

    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String phone;
    private String whatsapp;
    private String agency;
    private String city;
    private String avatar;
    private String bio;
    private Double rating;
    private Integer sold;
    private Boolean verified;
    private List<String> specialties;
}
