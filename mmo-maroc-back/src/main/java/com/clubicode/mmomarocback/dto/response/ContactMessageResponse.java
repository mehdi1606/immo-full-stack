package com.clubicode.mmomarocback.dto.response;

import com.clubicode.mmomarocback.entity.ContactMessage;
import com.clubicode.mmomarocback.enums.ContactMessageStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ContactMessageResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private String subject;
    private String message;
    private ContactMessageStatus status;
    private LocalDateTime createdAt;

    public static ContactMessageResponse from(ContactMessage m) {
        return ContactMessageResponse.builder()
                .id(m.getId())
                .name(m.getName())
                .phone(m.getPhone())
                .email(m.getEmail())
                .subject(m.getSubject())
                .message(m.getMessage())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
