package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.response.AgentSummaryResponse;
import com.clubicode.mmomarocback.dto.response.stats.CityStatsResponse;
import com.clubicode.mmomarocback.dto.response.stats.MonthlyStatsResponse;
import com.clubicode.mmomarocback.dto.response.stats.StatsOverviewResponse;
import com.clubicode.mmomarocback.dto.response.stats.TypeStatsResponse;
import com.clubicode.mmomarocback.service.IStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    private final IStatsService statsService;

    @GetMapping("/overview")
    public ResponseEntity<StatsOverviewResponse> getOverview() {
        return ResponseEntity.ok(statsService.getOverview());
    }

    @GetMapping("/by-month")
    public ResponseEntity<List<MonthlyStatsResponse>> getByMonth() {
        return ResponseEntity.ok(statsService.getByMonth());
    }

    @GetMapping("/top-agents")
    public ResponseEntity<List<AgentSummaryResponse>> getTopAgents() {
        return ResponseEntity.ok(statsService.getTopAgents());
    }

    @GetMapping("/by-city")
    public ResponseEntity<List<CityStatsResponse>> getByCity() {
        return ResponseEntity.ok(statsService.getByCity());
    }

    @GetMapping("/by-type")
    public ResponseEntity<List<TypeStatsResponse>> getByType() {
        return ResponseEntity.ok(statsService.getByType());
    }
}
