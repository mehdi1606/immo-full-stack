package com.clubicode.mmomarocback.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateAgentRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /** Optional — if null/blank, the service auto-generates firstName@year */
    private String password;

    private String phone;
    private String whatsapp;
    private String agency;
    private String city;
    private String avatar;
    private String bio;
    private Boolean verified;
    private List<String> specialties;

    /**
     * Role to assign to the new user account.
     * Accepted values (case-insensitive): "AGENT", "ADMIN".
     * Defaults to AGENT if null or blank.
     */
    private String role;
}
