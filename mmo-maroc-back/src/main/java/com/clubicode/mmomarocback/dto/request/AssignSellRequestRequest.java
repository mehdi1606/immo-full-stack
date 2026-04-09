package com.clubicode.mmomarocback.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignSellRequestRequest {

    @NotNull(message = "Agent ID is required")
    private Long agentId;
}
