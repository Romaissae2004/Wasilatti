package com.backend.wasilatti.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String brand;
    private Double price;
    private int quantity;
    private boolean inPromotion;
    private int promotionPercentage;
    private List<String> imageUrls;
    private CategoryInfo category;
    private CollaboratorInfo collaborator;

    @Data
    @AllArgsConstructor
    public static class CategoryInfo {
        private Long id;
        private String name;
    }

    @Data
    @AllArgsConstructor
    public static class CollaboratorInfo {
        private Long id;
        private String name;
    }

    private List<String> sizes;

    // ── Dépôt de stockage (visible livreur/admin uniquement) ──
    private String depotAddress;
    private Double depotLatitude;
    private Double depotLongitude;
}
