package com.backend.wasilatti.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemRequestDTO {

    @NotNull(message = "L'ID du produit est obligatoire")
    private Long productId;

    @Min(value = 1, message = "La quantité doit être supérieure ou égale à 1")
    private int quantity;
}
