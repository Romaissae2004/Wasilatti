package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByDriverId(Long driverId);
}
