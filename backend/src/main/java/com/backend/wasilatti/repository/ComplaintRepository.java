package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByClient_UsernameOrderByCreatedAtDesc(String username);

    Optional<Complaint> findByIdAndClient_Username(Long id, String username);
}
