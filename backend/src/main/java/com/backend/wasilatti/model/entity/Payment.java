package com.backend.wasilatti.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "payments")
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long driverId;

    @Column(nullable = false)
    private String driverName;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private Integer deliveries = 0;

    @Column(nullable = false)
    private Double amount = 0.0;

    @Column(nullable = false, length = 30)
    private String status = "EN_ATTENTE";

    private String iban;

    private String phone;
}
