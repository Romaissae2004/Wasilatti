package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    void deleteAllByProductId(Long productId);
}
