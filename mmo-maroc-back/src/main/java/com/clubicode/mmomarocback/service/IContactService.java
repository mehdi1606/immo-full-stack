package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.request.CreateContactRequest;
import com.clubicode.mmomarocback.dto.response.ContactMessageResponse;
import com.clubicode.mmomarocback.enums.ContactMessageStatus;

import java.util.List;

public interface IContactService {

    ContactMessageResponse submitMessage(CreateContactRequest request);

    List<ContactMessageResponse> getAllMessages(ContactMessageStatus status);

    ContactMessageResponse updateStatus(Long id, ContactMessageStatus status);
}
