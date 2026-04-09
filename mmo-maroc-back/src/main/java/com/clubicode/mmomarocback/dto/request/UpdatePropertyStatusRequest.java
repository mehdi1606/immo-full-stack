package com.clubicode.mmomarocback.dto.request;

import com.clubicode.mmomarocback.enums.PropertyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePropertyStatusRequest {

    @NotNull(message = "Status is required")
    private PropertyStatus status;
}
