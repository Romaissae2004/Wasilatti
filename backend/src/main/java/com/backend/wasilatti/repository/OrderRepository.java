package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Order;
import com.backend.wasilatti.model.enums.OrderStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByClient_Username(String username);
    List<Order> findByLivreur_Username(String username);
    List<Order> findByLivreur_Id(Long id);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i JOIN i.product p WHERE p.collaborator.id = :collaboratorId")
    List<Order> findByCollaboratorId(@Param("collaboratorId") Long collaboratorId);
    // Nouvelles méthodes pour la distribution
    @Query("""
        SELECT o FROM Order o
        WHERE o.status = 'CONFIRMÉE'
          AND o.livreur IS NULL
        ORDER BY o.createdAt ASC
    """)
    List<Order> findUnassignedConfirmedOrders();

    @Query("""
        SELECT o FROM Order o
        WHERE o.status = 'CONFIRMÉE'
          AND o.livreur IS NOT NULL
          AND o.assignedAt IS NOT NULL
          AND o.assignedAt < :cutoff
          AND o.driverAccepted = false
    """)
    List<Order> findTimedOutAssignments(@Param("cutoff") LocalDateTime cutoff);

    List<Order> findByLivreur_IdAndStatus(Long livreurId, OrderStatus status);

}
