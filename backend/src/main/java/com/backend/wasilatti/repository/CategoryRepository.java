package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Fix: Changed 'Collaborators' to 'Collaborator' to match the @ManyToOne property name
    List<Category> findByCollaborator_Id(Long collaboratorId);

    // Fix: Changed 'Collaborators' to 'Collaborator' here as well
    List<Category> findByCollaborator_IdAndNameContainingIgnoreCase(Long collaboratorId, String name);
}