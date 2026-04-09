package com.clubicode.mmomarocback.dto.response;

import com.clubicode.mmomarocback.enums.Role;
import com.clubicode.mmomarocback.enums.UserStatus;
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
public class AgentResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private LocalDateTime createdAt;

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
    private Integer listingCount;
}
