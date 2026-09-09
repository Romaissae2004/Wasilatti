package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    void deleteAllByProductId(Long productId);
}
