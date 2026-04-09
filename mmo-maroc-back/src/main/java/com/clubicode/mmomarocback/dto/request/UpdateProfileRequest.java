package com.clubicode.mmomarocback.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class UpdateProfileRequest {

    private String name;
    private String phone;
    private String whatsapp;
    private String agency;
    private String city;
    private String avatar;
    private String bio;
    private List<String> specialties;
}
