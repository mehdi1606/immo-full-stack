package com.clubicode.mmomarocback.dto.response.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsOverviewResponse {

    private long totalListings;
    private long activeListings;
    private long totalAgents;
    private long activeAgents;
    private long totalSold;
    private long totalRented;
    private long totalViews;
    private long newListingsThisMonth;
}
