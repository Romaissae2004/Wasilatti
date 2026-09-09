package com.backend.wasilatti.model.entity;

import com.backend.wasilatti.model.enums.DriverStatus;
import com.backend.wasilatti.model.enums.Vehicle;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
@Data @NoArgsConstructor @AllArgsConstructor
public class Driver {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "app_user_id", unique = true, nullable = false)
    private AppUser appUser;

    private String firstName;
    private String lastName;
    private String cin;
    private String phone;
    private String adresse;

    @Enumerated(EnumType.STRING)
    private Vehicle vehicle = Vehicle.MOTO;

    private String zone;

    @Enumerated(EnumType.STRING)
    private DriverStatus status = DriverStatus.HORS_LIGNE;

    private Double rating = 5.0;
    private Integer totalDeliveries = 0;
    private Double totalRevenue = 0.0;
    private String photoUrl;
    // Champs ajoutés pour la distribution automatique
    private Double currentLatitude;
    private Double currentLongitude;

    @Column(nullable = false)
    private Integer currentOrdersCount = 0;

    @Column(nullable = false)
    private Integer maxCapacity = 3;

    @Column(nullable = false)
    private Double performanceScore = 1.0;

    private LocalDateTime lastSeenAt;
}