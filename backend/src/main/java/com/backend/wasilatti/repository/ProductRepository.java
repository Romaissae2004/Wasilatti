package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Collaborator;
import com.backend.wasilatti.model.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByCategoryIdAndNameContainingIgnoreCase(Long categoryId, String name);

    // ── NOUVELLES MÉTHODES DE FILTRAGE ──────────────────────────────────────────

    // Si on filtre par catégorie ET par collaborateur
    List<Product> findByCategoryIdAndCollaboratorId(Long categoryId, Long collaboratorId);

    // Si on filtre par catégorie, par collaborateur ET par nom (pour la barre de recherche)
    List<Product> findByCategoryIdAndCollaboratorIdAndNameContainingIgnoreCase(Long categoryId, Long collaboratorId, String name);
    List<Product> findByCollaboratorId(Long collaboratorId);
    List<Product> findByCollaboratorIdAndNameContainingIgnoreCase(Long collaboratorId, String name);

}
