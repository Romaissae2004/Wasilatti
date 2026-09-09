package com.backend.wasilatti.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {

    private String deliveryAddress;

    private Double latitude;
    private Double longitude;

    private String contactPhone;
}
