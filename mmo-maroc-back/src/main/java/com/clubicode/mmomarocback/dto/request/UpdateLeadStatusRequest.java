package com.clubicode.mmomarocback.dto.request;

import com.clubicode.mmomarocback.enums.LeadStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateLeadStatusRequest {

    @NotNull(message = "Status is required")
    private LeadStatus status;
}
