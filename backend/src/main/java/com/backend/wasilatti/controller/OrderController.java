package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.OrderRequestDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.OrderResponseDTO;
import com.backend.wasilatti.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.backend.wasilatti.model.entity.Order;
import com.backend.wasilatti.repository.OrderRepository;
import com.backend.wasilatti.service.DistributionService;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final DistributionService distributionService;
    private final OrderRepository orderRepository;

    // ==========================================
    // ENDPOINTS CLIENT (Rôle: USER)
    // ==========================================

    @PostMapping("/api/orders")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> createOrder(
            Principal principal,
            @Valid @RequestBody OrderRequestDTO request) {
        OrderResponseDTO order = orderService.createOrder(principal.getName(), request);
        var response = new ApiResponse<>(true, "Commande créée avec succès", order);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/orders")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getMyOrders(Principal principal) {
        List<OrderResponseDTO> orders = orderService.getOrdersForClient(principal.getName());
        var response = new ApiResponse<>(true, "Vos commandes récupérées", orders);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/orders/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN', 'LIVREUR')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> getOrderDetails(
            Principal principal,
            @PathVariable Long id) {
        OrderResponseDTO order = orderService.getOrderById(id, principal.getName());
        var response = new ApiResponse<>(true, "Détails de la commande récupérés", order);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ENDPOINTS MERCHANT (Rôle: MARCHAND)
    // ==========================================

    @GetMapping("/api/merchant/orders")
    @PreAuthorize("hasAuthority('MARCHAND')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getMerchantOrders(Principal principal) {
        List<OrderResponseDTO> orders = orderService.getOrdersForMerchant(principal.getName());
        var response = new ApiResponse<>(true, "Vos commandes de marchand récupérées", orders);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ENDPOINTS ADMIN (Rôle: ADMIN)
    // ==========================================

    @GetMapping("/api/admin/orders")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getAllOrders() {
        List<OrderResponseDTO> orders = orderService.getAllOrders();
        var response = new ApiResponse<>(true, "Toutes les commandes récupérées (Admin)", orders);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/admin/orders/{id}/confirm")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> confirmOrder(@PathVariable Long id) {
        OrderResponseDTO order = orderService.confirmOrder(id);
        var response = new ApiResponse<>(true, "Commande confirmée avec succès (Notification Email envoyée)", order);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/admin/orders/{id}/retry-assign")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> retryAssign(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
        if (order.getLivreur() != null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Cette commande a déjà un livreur assigné"));
        }
        if (order.getStatus() != com.backend.wasilatti.model.enums.OrderStatus.CONFIRMÉE) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Seules les commandes CONFIRMÉE peuvent être réassignées"));
        }
        Optional<String> failure = distributionService.assignOrder(order);
        Order updated = orderRepository.findById(id).orElse(order);
        OrderResponseDTO dto = orderService.getOrderById(updated.getId(), updated.getClient().getUsername());
        if (updated.getLivreur() != null) {
            return ResponseEntity.ok(new ApiResponse<>(true,
                    "Livreur assigné automatiquement : " + updated.getLivreur().getUsername(), dto));
        }
        String msg = failure.orElse("Aucun livreur disponible — commande en file d'attente");
        return ResponseEntity.ok(new ApiResponse<>(false, msg, dto));
    }

    @PostMapping("/api/admin/orders/{id}/cancel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> cancelOrder(@PathVariable Long id) {
        OrderResponseDTO order = orderService.cancelOrder(id);
        var response = new ApiResponse<>(true, "Commande annulée (Stocks rétablis)", order);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/admin/orders/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        var response = new ApiResponse<Void>(true, "Commande supprimée avec succès", null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/admin/orders/{id}/assign-livreur")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> assignLivreur(
            @PathVariable Long id,
            @RequestParam Long livreurId) {
        OrderResponseDTO order = orderService.assignLivreur(id, livreurId);
        var response = new ApiResponse<>(true, "Livreur assigné et statut mis à jour (EN_LIVRAISON)", order);
        return ResponseEntity.ok(response);
    }
    // Admin : commandes sans livreur (file d'attente)

    @GetMapping("/api/admin/orders/pending")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<Order>>> getPendingOrders() {
        return ResponseEntity.ok(
             new ApiResponse<>(true, "Commandes en attente", orderRepository.findUnassignedConfirmedOrders())
        );
    }
    // ==========================================
    // ENDPOINTS LIVREUR (Rôle: LIVREUR)
    // ==========================================

    @GetMapping("/api/delivery/orders")
    @PreAuthorize("hasAuthority('LIVREUR')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getMyDeliveryOrders(Principal principal) {
        List<OrderResponseDTO> orders = orderService.getOrdersForLivreur(principal.getName());
        var response = new ApiResponse<>(true, "Vos livraisons récupérées", orders);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/delivery/orders/{id}/deliver")
    @PreAuthorize("hasAuthority('LIVREUR')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> markOrderAsDelivered(
            Principal principal,
            @PathVariable Long id) {
        OrderResponseDTO order = orderService.markOrderAsDelivered(id, principal.getName());
        var response = new ApiResponse<>(true, "Commande marquée comme LIVRÉE", order);
        return ResponseEntity.ok(response);
    }
    // Livreur accepte sa commande (annule le timeout, passe en livraison active)
    @PatchMapping("/api/delivery/orders/{id}/accept")
    @PreAuthorize("hasAuthority('LIVREUR')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> acceptOrder(
            @PathVariable Long id,
            Principal principal) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (order.getLivreur() == null || !order.getLivreur().getUsername().equals(principal.getName())) {
            return ResponseEntity.status(403)
                    .body(new ApiResponse<>(false, "Vous n'êtes pas le livreur assigné"));
        }

        distributionService.onDriverAccepted(id);
        OrderResponseDTO dto = orderService.getOrderById(id, principal.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Commande récupérée — en livraison", dto));
    }

    @PostMapping("/api/delivery/orders/{id}/status")
    @PreAuthorize("hasAuthority('LIVREUR')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Principal principal) {
        try {
            String normalizedStatus = status.trim().toUpperCase()
                    .replace("RETOURNEE", "RETOURNÉE")
                    .replace("LIVREE", "LIVRÉE")
                    .replace("ANNULEE", "ANNULÉE")
                    .replace("CONFIRMEE", "CONFIRMÉE");
            com.backend.wasilatti.model.enums.OrderStatus orderStatus = com.backend.wasilatti.model.enums.OrderStatus.valueOf(normalizedStatus);
            OrderResponseDTO order = orderService.updateOrderStatusForLivreur(id, orderStatus, principal.getName());
            var response = new ApiResponse<>(true, "Statut de la commande mis à jour", order);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("c:\\PFA\\error.log", true));
                pw.println("ERROR IN updateOrderStatus: " + e.getMessage());
                e.printStackTrace(pw);
                if (e.getCause() != null) {
                    pw.println("CAUSE:");
                    e.getCause().printStackTrace(pw);
                }
                pw.close();
            } catch (Exception ex) {}
            throw e;
        }
    }
}
