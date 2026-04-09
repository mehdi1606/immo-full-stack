package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.UserRepository;
import com.clubicode.mmomarocback.dto.response.AgentSummaryResponse;
import com.clubicode.mmomarocback.dto.response.stats.CityStatsResponse;
import com.clubicode.mmomarocback.dto.response.stats.MonthlyStatsResponse;
import com.clubicode.mmomarocback.dto.response.stats.StatsOverviewResponse;
import com.clubicode.mmomarocback.dto.response.stats.TypeStatsResponse;
import com.clubicode.mmomarocback.enums.PropertyStatus;
import com.clubicode.mmomarocback.enums.UserStatus;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import com.clubicode.mmomarocback.service.IStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements IStatsService {

    private final PropertyRepository propertyRepository;
    private final AgentRepository agentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public StatsOverviewResponse getOverview() {
        long totalListings = propertyRepository.count();
        long activeListings = propertyRepository.countByStatus(PropertyStatus.DISPONIBLE);
        long totalAgents = agentRepository.count();
        long activeAgents = agentRepository.countByUserStatus(UserStatus.ACTIVE);
        long totalSold = propertyRepository.countByStatus(PropertyStatus.VENDU);
        long totalRented = propertyRepository.countByStatus(PropertyStatus.LOUE);
        Long viewsSum = propertyRepository.sumAllViews();
        long totalViews = viewsSum != null ? viewsSum : 0L;
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long newListingsThisMonth = propertyRepository.countCreatedSince(startOfMonth);

        return StatsOverviewResponse.builder()
                .totalListings(totalListings)
                .activeListings(activeListings)
                .totalAgents(totalAgents)
                .activeAgents(activeAgents)
                .totalSold(totalSold)
                .totalRented(totalRented)
                .totalViews(totalViews)
                .newListingsThisMonth(newListingsThisMonth)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonthlyStatsResponse> getByMonth() {
        LocalDateTime since = LocalDateTime.now().minusMonths(12);
        List<Object[]> results = propertyRepository.countByMonth(since);
        return results.stream()
                .map(row -> MonthlyStatsResponse.builder()
                        .month(((Number) row[0]).intValue())
                        .year(((Number) row[1]).intValue())
                        .count(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AgentSummaryResponse> getTopAgents() {
        return agentRepository.findTopAgentsBySold(PageRequest.of(0, 5))
                .stream()
                .map(AgentServiceImpl::toAgentSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CityStatsResponse> getByCity() {
        return propertyRepository.countByCity().stream()
                .map(row -> CityStatsResponse.builder()
                        .city((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TypeStatsResponse> getByType() {
        return propertyRepository.countByType().stream()
                .map(row -> TypeStatsResponse.builder()
                        .type(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }
}
