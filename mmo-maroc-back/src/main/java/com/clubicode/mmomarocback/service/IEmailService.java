package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.entity.ContactMessage;
import com.clubicode.mmomarocback.entity.Lead;
import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.SellRequest;

import java.util.List;

public interface IEmailService {

    void sendLeadNotificationToAgent(Lead lead);

    void sendSellRequestConfirmationToClient(SellRequest request);

    void sendSellRequestNotificationToAdmin(SellRequest request);

    void sendAgentWelcomeEmail(String email, String name, String password);

    void sendContactMessageToAdmin(ContactMessage message);

    void sendContactConfirmationToSender(ContactMessage message);

    void sendPasswordResetEmail(String email, String name, String newPassword);

    void sendExpiredListingsNotificationToAdmin(List<Property> expiredListings);
}
