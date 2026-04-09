package com.clubicode.mmomarocback.dto.response;

import com.clubicode.mmomarocback.enums.SellRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellRequestResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private String city;
    private String propertyType;
    private String purpose;
    private Double price;
    private Double area;
    private Integer rooms;
    private String title;
    private String description;
    private SellRequestStatus status;
    private LocalDateTime createdAt;
    private AgentSummaryResponse assignedAgent;
}
