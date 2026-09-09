package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.model.entity.Driver;
import com.backend.wasilatti.model.enums.DriverStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByAppUser_Id(Long appUserId);
    Optional<Driver> findByAppUser_Email(String email);
    Optional<Driver> findByAppUser(AppUser appUser);
    // Nouvelles méthodes pour la distribution
    @Query("""
        SELECT d FROM Driver d
        WHERE d.status IN ('DISPONIBLE', 'EN_LIVRAISON')
          AND d.currentOrdersCount < d.maxCapacity
          AND d.lastSeenAt IS NOT NULL
          AND d.lastSeenAt >= :onlineSince
    """)
    List<Driver> findAssignableDrivers(@Param("onlineSince") LocalDateTime onlineSince);

    List<Driver> findByStatusAndCurrentLatitudeIsNotNull(DriverStatus status);

    Optional<Driver> findByAppUser_Username(String username);
}