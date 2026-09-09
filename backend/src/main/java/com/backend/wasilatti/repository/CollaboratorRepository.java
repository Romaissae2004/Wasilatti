package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Collaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollaboratorRepository extends JpaRepository<Collaborator, Long> {

    // Filter by name (partial, case-insensitive)
    List<Collaborator> findByNameContainingIgnoreCase(String name);
}