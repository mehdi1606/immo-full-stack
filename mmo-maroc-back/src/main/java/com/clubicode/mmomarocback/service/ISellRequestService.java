package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.request.AssignSellRequestRequest;
import com.clubicode.mmomarocback.dto.request.CreateSellRequestRequest;
import com.clubicode.mmomarocback.dto.request.UpdateSellRequestStatusRequest;
import com.clubicode.mmomarocback.dto.response.SellRequestResponse;
import com.clubicode.mmomarocback.enums.SellRequestStatus;

import java.util.List;

public interface ISellRequestService {

    SellRequestResponse createSellRequest(CreateSellRequestRequest request);

    List<SellRequestResponse> getAllSellRequests(SellRequestStatus status);

    SellRequestResponse updateSellRequestStatus(Long id, UpdateSellRequestStatusRequest request);

    SellRequestResponse assignSellRequest(Long id, AssignSellRequestRequest request);
}
