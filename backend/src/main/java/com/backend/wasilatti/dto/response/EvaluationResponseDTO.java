package com.backend.wasilatti.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationResponseDTO {
    private Long id;
    private Long orderId;
    private Long clientId;
    private String clientUsername;
    private Long driverId;
    private String driverUsername;
    private String driverName;
    private Integer rating;
    private String comment;
    private Instant createdAt;
    private Instant updatedAt;
}
