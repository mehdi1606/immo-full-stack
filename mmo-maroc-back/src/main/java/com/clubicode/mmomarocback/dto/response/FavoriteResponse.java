package com.clubicode.mmomarocback.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteResponse {

    private Long id;
    private Long userId;
    private LocalDateTime createdAt;
    private PropertySummaryResponse property;
}
