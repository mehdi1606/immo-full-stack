package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.response.AgentSummaryResponse;
import com.clubicode.mmomarocback.dto.response.stats.CityStatsResponse;
import com.clubicode.mmomarocback.dto.response.stats.MonthlyStatsResponse;
import com.clubicode.mmomarocback.dto.response.stats.StatsOverviewResponse;
import com.clubicode.mmomarocback.dto.response.stats.TypeStatsResponse;

import java.util.List;

public interface IStatsService {

    StatsOverviewResponse getOverview();

    List<MonthlyStatsResponse> getByMonth();

    List<AgentSummaryResponse> getTopAgents();

    List<CityStatsResponse> getByCity();

    List<TypeStatsResponse> getByType();
}
