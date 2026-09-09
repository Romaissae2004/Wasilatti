package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.request.CategoryRequestDTO;
import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.exception.CategoryNotFoundException;
import com.backend.wasilatti.exception.CollaboratorNotFoundException;
import com.backend.wasilatti.exception.ProductNotFoundException;
import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Collaborator;
import com.backend.wasilatti.model.entity.Product;
import com.backend.wasilatti.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private final ProductRepository productRepository;
    private final CollaboratorRepository collaboratorRepository;

    public CategoryService(CategoryRepository categoryRepository,  ProductRepository productRepository, CollaboratorRepository collaboratorRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.collaboratorRepository = collaboratorRepository;

    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category " + id + " not found"));
    }

    public Category createCategory(CategoryRequestDTO request) {
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        // Récupérer le collaborateur et l'associer à la catégorie
        Collaborator collaborator = collaboratorRepository.findById(request.getCollaboratorId())
                .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + request.getCollaboratorId() + " not found"));

        // Suivant la structure de votre entité (ex: category.setCollaborator(collaborator))
        category.setCollaborator(collaborator);

        // If you need to handle the image_id from the DTO, add it here:
        // if (request.getImageId() != null) { ... }

        return categoryRepository.save(category);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCategoryById(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new CategoryNotFoundException("Category " + id + " not found");
        }
        
        List<Product> products = productRepository.findByCategoryId(id);
        for (Product product : products) {
            product.setCategory(null);
            productRepository.save(product);
        }
        
        categoryRepository.deleteById(id);
    }

    // 1. Correction du PUT (On utilise le DTO pour écraser les champs requis)
    public Category updateCategory(Long id, CategoryRequestDTO request) {
        Category savedCategory = getCategoryById(id);

        if (request.getName() != null) {
            savedCategory.setName(request.getName());
        }
        if (request.getDescription() != null) {
            savedCategory.setDescription(request.getDescription());
        }

        // Optionnel : Si vous devez aussi changer le collaborateur lors d'un PUT
        if (request.getCollaboratorId() != null) {
            Collaborator collaborator = collaboratorRepository.findById(request.getCollaboratorId())
                    .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + request.getCollaboratorId() + " not found"));
            savedCategory.setCollaborator(collaborator);
        }

        return categoryRepository.save(savedCategory);
    }

    // 2. Ajout du PATCH (On vérifie chaque champ individuellement avant de modifier)
    public Category patchCategory(Long id, CategoryRequestDTO request) {
        Category savedCategory = getCategoryById(id);

        // Si le nom est fourni dans le JSON, on le met à jour
        if (request.getName() != null) {
            savedCategory.setName(request.getName());
        }

        // Si la description est fournie dans le JSON, on la met à jour
        if (request.getDescription() != null) {
            savedCategory.setDescription(request.getDescription());
        }

        // Si le collaborateur_id est fourni, on met à jour la relation
        if (request.getCollaboratorId() != null) {
            Collaborator collaborator = collaboratorRepository.findById(request.getCollaboratorId())
                    .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + request.getCollaboratorId() + " not found"));
            savedCategory.setCollaborator(collaborator);
        }

        return categoryRepository.save(savedCategory);
    }

    public Category addProductToCategory(Long categoryId, Long productId) {
        Category category = getCategoryById(categoryId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product " + productId + " not found"));

        product.setCategory(category); // Crucial for @ManyToOne side
        category.getProducts().add(product);
        return categoryRepository.save(category);
    }

    public void removeProductFromCategory(Long categoryId, Long productId) {
        Category category = getCategoryById(categoryId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product " + productId + " not found"));

        product.setCategory(null);
        category.getProducts().remove(product);
        categoryRepository.save(category);
    }

    // Get all products belonging to a category, with optional name filter
    public List<Product> getProductsByCategory(Long categoryId, String name) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new CategoryNotFoundException("Category " + categoryId + " not found");
        }

        if (name != null && !name.isBlank()) {
            return productRepository.findByCategoryIdAndNameContainingIgnoreCase(categoryId, name);
        }
        return productRepository.findByCategoryId(categoryId);
    }

    // À ajouter dans votre CategoryService.java

    /**
     * Récupère les produits d'une catégorie avec un filtre optionnel sur le nom et/ou le collaborateur.
     */
    public List<Product> getProductsByCategoryAndCollaborator(Long categoryId, String name, Long collaboratorId) {
        // 1. Sécurité : On vérifie que la catégorie existe bien
        if (!categoryRepository.existsById(categoryId)) {
            throw new CategoryNotFoundException("Category " + categoryId + " not found");
        }

        boolean hasName = (name != null && !name.isBlank());
        boolean hasCollaborator = (collaboratorId != null);

        // 2. Scénario A : Filtrage par Catégorie + Collaborateur
        if (hasCollaborator) {
            if (hasName) {
                // Catégorie + Collaborateur + Recherche par nom
                return productRepository.findByCategoryIdAndCollaboratorIdAndNameContainingIgnoreCase(categoryId, collaboratorId, name);
            }
            // Uniquement Catégorie + Collaborateur
            return productRepository.findByCategoryIdAndCollaboratorId(categoryId, collaboratorId);
        }

        // 3. Scénario B : Comportement d'origine (Catégorie seule ou Catégorie + Nom)
        if (hasName) {
            return productRepository.findByCategoryIdAndNameContainingIgnoreCase(categoryId, name);
        }

        return productRepository.findByCategoryId(categoryId);
    }

    // Exemple de correction dans votre CategoryService (ou dans le Controller correspondant)
// 1. Injectez ou utilisez un mapper pour obtenir des ProductResponseDTO

    public List<ProductResponseDTO> getProductsByCategoryAndCollaboratorDTO(Long categoryId, String name, Long collaboratorId) {
        // Récupère les entités brutes depuis le repository
        List<Product> products = getProductsByCategoryAndCollaborator(categoryId, name, collaboratorId);

        // Convertit chaque Product en ProductResponseDTO (comme dans ProductService)
        return products.stream().map(product -> {
            ProductResponseDTO dto = new ProductResponseDTO();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setPrice(product.getPrice());
            dto.setQuantity(product.getQuantity());

            if (product.getImages() != null) {
                dto.setImageUrls(product.getImages().stream().map(img -> img.getImage_url()).toList());
            }
            if (product.getCategory() != null) {
                dto.setCategory(new ProductResponseDTO.CategoryInfo(product.getCategory().getId(), product.getCategory().getName()));
            }
            if (product.getCollaborator() != null) {
                dto.setCollaborator(new ProductResponseDTO.CollaboratorInfo(product.getCollaborator().getId(), product.getCollaborator().getName()));
            }
            return dto;
        }).toList();
    }
}
