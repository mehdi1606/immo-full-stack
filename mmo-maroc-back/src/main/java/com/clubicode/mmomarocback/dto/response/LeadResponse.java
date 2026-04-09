package com.clubicode.mmomarocback.dto.response;

import com.clubicode.mmomarocback.enums.LeadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private String message;
    private LeadStatus status;
    private LocalDateTime createdAt;
    private Long propertyId;
    private String propertyTitle;
    private String propertyCity;
    private Long agentId;
    private String agentName;
}
