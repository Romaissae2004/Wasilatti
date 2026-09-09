package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.CartItemRequestDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.CartResponseDTO;
import com.backend.wasilatti.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('USER')")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponseDTO>> getCart(Principal principal) {
        CartResponseDTO cart = cartService.getCartDTO(principal.getName());
        var response = new ApiResponse<>(true, "Panier récupéré avec succès", cart);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponseDTO>> addItemToCart(
            Principal principal,
            @Valid @RequestBody CartItemRequestDTO request) {
        CartResponseDTO cart = cartService.addItemToCart(principal.getName(), request);
        var response = new ApiResponse<>(true, "Produit ajouté au panier", cart);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponseDTO>> updateItemQuantity(
            Principal principal,
            @PathVariable Long itemId,
            @RequestParam int quantity) {
        CartResponseDTO cart = cartService.updateCartItemQuantity(principal.getName(), itemId, quantity);
        var response = new ApiResponse<>(true, "Quantité mise à jour", cart);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponseDTO>> removeItemFromCart(
            Principal principal,
            @PathVariable Long itemId) {
        CartResponseDTO cart = cartService.removeCartItem(principal.getName(), itemId);
        var response = new ApiResponse<>(true, "Produit supprimé du panier", cart);
        return ResponseEntity.ok(response);
    }
}
