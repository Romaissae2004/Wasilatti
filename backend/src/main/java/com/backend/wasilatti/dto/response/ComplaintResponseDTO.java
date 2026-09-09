package com.backend.wasilatti.dto.response;

import com.backend.wasilatti.model.enums.ComplaintSeverity;
import com.backend.wasilatti.model.enums.ComplaintStatus;
import com.backend.wasilatti.model.enums.ComplaintType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponseDTO {

    private Long id;
    private String reference;
    private Long clientId;
    private String clientName;
    private String clientEmail;
    private Long orderId;
    private Long driverId;
    private String driverName;
    private ComplaintType type;
    private String subject;
    private String description;
    private ComplaintSeverity severity;
    private ComplaintStatus status;
    private String adminResponse;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;
}
