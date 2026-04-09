package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.request.CreateAgentRequest;
import com.clubicode.mmomarocback.dto.request.UpdateAgentRequest;
import com.clubicode.mmomarocback.dto.request.UpdateProfileRequest;
import com.clubicode.mmomarocback.dto.response.AgentResponse;
import com.clubicode.mmomarocback.entity.User;

import java.util.List;

public interface IAgentService {

    List<AgentResponse> getAllAgents(String city);

    /** Admin-only: returns ALL agents (active + inactive) */
    List<AgentResponse> getAllAgentsAdmin();

    AgentResponse getAgentById(Long id);

    AgentResponse createAgent(CreateAgentRequest request);

    AgentResponse updateAgent(Long id, UpdateAgentRequest request);

    void deleteAgent(Long id);

    AgentResponse toggleStatus(Long id);

    AgentResponse updateMyProfile(User currentUser, UpdateProfileRequest request);

    void resetAgentPassword(Long id);
}
