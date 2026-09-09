package com.backend.wasilatti.Web;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DriverDTO {
    private Long id;
    private Long appUserId;
    private String username;
    private String email;
    private String name;
    private String firstName;
    private String lastName;
    private String cin;
    private String phone;
    private String adresse;
    private String vehicle;
    private String zone;
    private String status;
    private Double rating;
    private Integer deliveries;
    private Double revenue;
    private String photo;
    private Double currentLatitude;
    private Double currentLongitude;
    private Integer currentOrdersCount;
    private Integer maxCapacity;
    private LocalDateTime lastSeenAt;
    private boolean online;
}