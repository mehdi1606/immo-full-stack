package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.request.CreateContactRequest;
import com.clubicode.mmomarocback.dto.response.ContactMessageResponse;
import com.clubicode.mmomarocback.entity.ContactMessage;
import com.clubicode.mmomarocback.enums.ContactMessageStatus;
import com.clubicode.mmomarocback.repository.ContactMessageRepository;
import com.clubicode.mmomarocback.service.IContactService;
import com.clubicode.mmomarocback.service.IEmailService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements IContactService {

    private final ContactMessageRepository contactMessageRepository;
    private final IEmailService emailService;

    @Override
    public ContactMessageResponse submitMessage(CreateContactRequest request) {
        ContactMessage message = ContactMessage.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .subject(request.getSubject())
                .message(request.getMessage())
                .build();

        ContactMessage saved = contactMessageRepository.save(message);

        // Async emails — do not block response
        emailService.sendContactMessageToAdmin(saved);
        emailService.sendContactConfirmationToSender(saved);

        log.info("Contact message saved from {} <{}>", saved.getName(), saved.getEmail());
        return ContactMessageResponse.from(saved);
    }

    @Override
    public List<ContactMessageResponse> getAllMessages(ContactMessageStatus status) {
        List<ContactMessage> messages = (status != null)
                ? contactMessageRepository.findByStatusOrderByCreatedAtDesc(status)
                : contactMessageRepository.findAllByOrderByCreatedAtDesc();

        return messages.stream().map(ContactMessageResponse::from).toList();
    }

    @Override
    public ContactMessageResponse updateStatus(Long id, ContactMessageStatus status) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Message introuvable: " + id));
        message.setStatus(status);
        return ContactMessageResponse.from(contactMessageRepository.save(message));
    }
}
