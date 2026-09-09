package com.backend.wasilatti.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProductRequestDTO {
    @NotBlank(message = "Product name cannot be empty")
    private String name;

    @NotBlank(message = "Description cannot be empty")
    private String description;


    private String brand;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;

    @Positive(message = "Quantity cannot be negative")
    private int quantity;

    private boolean inPromotion;
    private int promotionPercentage;

    private Long categoryId;
    private Long collaboratorId;

    private List<String> sizes;

    // ── Dépôt de stockage ──
    private String depotAddress;
    private Double depotLatitude;
    private Double depotLongitude;
}
