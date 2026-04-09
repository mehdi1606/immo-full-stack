package com.clubicode.mmomarocback.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentSummaryResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String agency;
    private String city;
    private String avatar;
    private Double rating;
    private Integer sold;
    private Boolean verified;
    private Integer listingCount;
}
