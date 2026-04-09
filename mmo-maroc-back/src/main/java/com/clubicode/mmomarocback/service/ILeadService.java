package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.request.CreateLeadRequest;
import com.clubicode.mmomarocback.dto.request.UpdateLeadStatusRequest;
import com.clubicode.mmomarocback.dto.response.LeadResponse;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.LeadStatus;

import java.util.List;

public interface ILeadService {

    LeadResponse createLead(CreateLeadRequest request);

    List<LeadResponse> getMyLeads(User currentUser, LeadStatus status);

    List<LeadResponse> getAllLeads(LeadStatus status);

    LeadResponse updateLeadStatus(Long id, User currentUser, UpdateLeadStatusRequest request);
}
