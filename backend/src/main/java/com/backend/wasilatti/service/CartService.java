package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.request.CartItemRequestDTO;
import com.backend.wasilatti.dto.response.CartItemResponseDTO;
import com.backend.wasilatti.dto.response.CartResponseDTO;
import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.exception.InsufficientQuantityException;
import com.backend.wasilatti.exception.ProductNotFoundException;
import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.model.entity.*;
import com.backend.wasilatti.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AppUserRepository userRepository;

    public Cart getOrCreateCart(String username) {
        return cartRepository.findByUser_Username(username)
                .orElseGet(() -> {
                    AppUser user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + username));
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    public CartResponseDTO getCartDTO(String username) {
        Cart cart = getOrCreateCart(username);
        return mapToCartResponseDTO(cart);
    }

    public CartResponseDTO addItemToCart(String username, CartItemRequestDTO request) {
        Cart cart = getOrCreateCart(username);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Produit introuvable avec l'ID: " + request.getProductId()));

        // Vérifier le stock disponible
        if (product.getQuantity() < request.getQuantity()) {
            throw new InsufficientQuantityException(product.getName());
        }

        // Vérifier si le produit est déjà dans le panier
        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (product.getQuantity() < newQuantity) {
                throw new InsufficientQuantityException(product.getName());
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(request.getQuantity());
            cartItemRepository.save(newItem);
            cart.getItems().add(newItem);
        }

        return mapToCartResponseDTO(cart);
    }

    public CartResponseDTO updateCartItemQuantity(String username, Long itemId, int quantity) {
        Cart cart = getOrCreateCart(username);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Élément du panier introuvable"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("Cet élément n'appartient pas à votre panier");
        }

        if (quantity <= 0) {
            cart.getItems().remove(cartItem);
            cartItemRepository.delete(cartItem);
        } else {
            Product product = cartItem.getProduct();
            if (product.getQuantity() < quantity) {
                throw new InsufficientQuantityException(product.getName());
            }
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }

        return mapToCartResponseDTO(cart);
    }

    public CartResponseDTO removeCartItem(String username, Long itemId) {
        Cart cart = getOrCreateCart(username);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Élément du panier introuvable"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("Cet élément n'appartient pas à votre panier");
        }

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        return mapToCartResponseDTO(cart);
    }

    public void clearCart(Cart cart) {
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private CartResponseDTO mapToCartResponseDTO(Cart cart) {
        CartResponseDTO dto = new CartResponseDTO();
        dto.setId(cart.getId());
        dto.setUsername(cart.getUser().getUsername());

        List<CartItemResponseDTO> itemDTOs = new ArrayList<>();
        double totalPrice = 0.0;

        for (CartItem item : cart.getItems()) {
            CartItemResponseDTO itemDTO = new CartItemResponseDTO();
            itemDTO.setId(item.getId());
            itemDTO.setQuantity(item.getQuantity());
            
            ProductResponseDTO prodDTO = mapProductToResponseDTO(item.getProduct());
            itemDTO.setProduct(prodDTO);
            
            itemDTOs.add(itemDTO);

            // Calcul du prix total (prend en compte la promotion s'il y en a une)
            double itemPrice = item.getProduct().getPrice();
            if (item.getProduct().isInPromotion()) {
                itemPrice = itemPrice * (1.0 - (item.getProduct().getPromotionPercentage() / 100.0));
            }
            totalPrice += itemPrice * item.getQuantity();
        }

        dto.setItems(itemDTOs);
        dto.setTotalPrice(totalPrice);
        return dto;
    }

    public static ProductResponseDTO mapProductToResponseDTO(Product product) {
        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setBrand(product.getBrand());
        dto.setPrice(product.getPrice());
        dto.setQuantity(product.getQuantity());
        dto.setInPromotion(product.isInPromotion());
        dto.setPromotionPercentage(product.getPromotionPercentage());
        dto.setSizes(product.getSizes());

        if (product.getImages() != null) {
            dto.setImageUrls(product.getImages().stream()
                    .map(Image::getImage_url)
                    .toList());
        }

        if (product.getCategory() != null) {
            dto.setCategory(new ProductResponseDTO.CategoryInfo(
                    product.getCategory().getId(),
                    product.getCategory().getName()
            ));
        }

        if (product.getCollaborator() != null) {
            dto.setCollaborator(new ProductResponseDTO.CollaboratorInfo(
                    product.getCollaborator().getId(),
                    product.getCollaborator().getName()
            ));
        }

        dto.setDepotAddress(product.getDepotAddress());
        dto.setDepotLatitude(product.getDepotLatitude());
        dto.setDepotLongitude(product.getDepotLongitude());

        return dto;
    }
}
