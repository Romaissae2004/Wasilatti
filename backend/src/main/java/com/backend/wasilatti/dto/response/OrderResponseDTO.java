package com.backend.wasilatti.dto.response;

import com.backend.wasilatti.model.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDTO {
    private Long id;
    private String clientUsername;
    private String clientEmail;
    private OrderStatus status;
    private String deliveryAddress;
    private Double latitude;
    private Double longitude;
    private Double merchantLatitude;
    private Double merchantLongitude;
    private boolean driverAccepted;
    private LocalDateTime assignedAt;
    private Double totalPrice;
    private List<OrderItemInfo> items;
    private LivreurInfo livreur;
    private String contactPhone;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemInfo {
        private Long id;
        private ProductResponseDTO product;
        private int quantity;
        private Double price;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivreurInfo {
        private Long id;
        private String username;
        private String email;
        private String phoneNumber;
        private Double currentLatitude;
        private Double currentLongitude;
    }
}
