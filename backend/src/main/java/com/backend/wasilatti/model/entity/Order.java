package com.backend.wasilatti.model.entity;

import com.backend.wasilatti.model.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders")
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private AppUser client;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private String deliveryAddress;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private Double totalPrice;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "livreur_id")
    private AppUser livreur;

    private String contactPhone;
    // Champs ajoutés pour la distribution automatique
    private Double merchantLatitude;
    private Double merchantLongitude;
    private LocalDateTime assignedAt;

    @Column(nullable = false)
    private boolean driverAccepted = false;
}
