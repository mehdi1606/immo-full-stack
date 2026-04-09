package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.request.ChangePasswordRequest;
import com.clubicode.mmomarocback.dto.request.LoginRequest;
import com.clubicode.mmomarocback.dto.response.AgentResponse;
import com.clubicode.mmomarocback.dto.response.AuthResponse;
import com.clubicode.mmomarocback.entity.User;

public interface IAuthService {

    AuthResponse login(LoginRequest request);

    AgentResponse getCurrentUser(User user);

    void changePassword(User currentUser, ChangePasswordRequest request);
}
