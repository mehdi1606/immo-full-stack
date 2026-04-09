package com.clubicode.mmomarocback.dto.request;

import com.clubicode.mmomarocback.enums.SellRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateSellRequestStatusRequest {

    @NotNull(message = "Status is required")
    private SellRequestStatus status;
}
