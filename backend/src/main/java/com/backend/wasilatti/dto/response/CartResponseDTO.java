package com.backend.wasilatti.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartResponseDTO {
    private Long id;
    private String username;
    private List<CartItemResponseDTO> items;
    private Double totalPrice;
}
