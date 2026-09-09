package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.exception.CategoryNotFoundException;
import com.backend.wasilatti.exception.CollaboratorNotFoundException;
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Collaborator;
import com.backend.wasilatti.model.entity.Product;
import com.backend.wasilatti.repository.CategoryRepository;
import com.backend.wasilatti.repository.CollaboratorRepository;
import com.backend.wasilatti.repository.ProductRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Service;

import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.model.entity.AppRole;
import com.backend.wasilatti.dto.request.CollaboratorRequestDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CollaboratorService {

    private final CollaboratorRepository collaboratorRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AccountService accountService;
    private final PasswordEncoder passwordEncoder;

    public CollaboratorService(CollaboratorRepository collaboratorRepository,
                               CategoryRepository categoryRepository,
                               ProductRepository productRepository,
                               AccountService accountService,
                               PasswordEncoder passwordEncoder) {
        this.collaboratorRepository = collaboratorRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.accountService = accountService;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Collaborator> getAllCollaborators() {
        return collaboratorRepository.findAll();
    }

    public List<Collaborator> searchCollaboratorsByName(String name) {
        return collaboratorRepository.findByNameContainingIgnoreCase(name);
    }

    public Collaborator getCollaboratorById(Long id) {
        return collaboratorRepository.findById(id)
                .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + id + " not found"));
    }

    public Collaborator createCollaborator(CollaboratorRequestDTO request) {
        Collaborator collaborator = new Collaborator();
        collaborator.setName(request.getName());

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            AppUser appUser = new AppUser();
            appUser.setUsername(request.getUsername().trim());
            appUser.setEmail(request.getEmail() != null ? request.getEmail().trim() : "");
            appUser.setPassword(request.getPassword());
            appUser.setPhoneNumber(request.getPhoneNumber());

            AppRole merchantRole = accountService.getOrCreateRole("MARCHAND");
            appUser.setAppRoles(java.util.List.of(merchantRole));

            AppUser savedUser = accountService.registerUser(appUser, true);
            collaborator.setUser(savedUser);
        }

        return collaboratorRepository.save(collaborator); // ✅ objet Collaborator
    }

    public Collaborator updateCollaborator(Long id, CollaboratorRequestDTO request) {
        Collaborator saved = collaboratorRepository.findById(id)
                .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + id + " not found"));
        saved.setName(request.getName());

        AppUser user = saved.getUser();
        if (user != null) {
            if (request.getEmail() != null) {
                user.setEmail(request.getEmail().trim());
            }
            if (request.getPhoneNumber() != null) {
                user.setPhoneNumber(request.getPhoneNumber());
            }
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            // Mettre à jour l'utilisateur si nécessaire
        }

        return collaboratorRepository.save(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCollaborator(Long id) {
        Collaborator collab = collaboratorRepository.findById(id)
                .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + id + " not found"));
        
        List<Product> products = productRepository.findByCollaboratorId(id);
        for (Product product : products) {
            product.setCollaborator(null);
            productRepository.save(product);
        }
        
        List<Category> categories = categoryRepository.findByCollaborator_Id(id);
        for (Category category : categories) {
            category.setCollaborator(null);
            categoryRepository.save(category);
        }
        
        AppUser user = collab.getUser();
        collaboratorRepository.deleteById(id);
        
        if (user != null) {
            accountService.deleteUser(user.getId());
        }
    }

    // Assign a category to a collaborator
    public Collaborator addCategoryToCollaborator(Long collaboratorId, Long categoryId) {
        Collaborator collaborator = getCollaboratorById(collaboratorId);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category " + categoryId + " not found"));

        // Since Collaborator owns the relationship, adding to this list updates the join table
        if (!collaborator.getCategories().contains(category)) {
            collaborator.getCategories().add(category);
        }

        return collaboratorRepository.save(collaborator);
    }

    // Remove a category from a collaborator
    public void removeCategoryFromCollaborator(Long collaboratorId, Long categoryId) {
        Collaborator collaborator = getCollaboratorById(collaboratorId);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category " + categoryId + " not found"));

        collaborator.getCategories().remove(category);
        collaboratorRepository.save(collaborator);
    }

    // Get all categories belonging to a collaborator, with optional name filter
    public List<Category> getCategoriesByCollaborator(Long collaboratorId, String name) {
        if (!collaboratorRepository.existsById(collaboratorId)) {
            throw new CollaboratorNotFoundException("Collaborator " + collaboratorId + " not found");
        }

        if (name != null && !name.isBlank()) {
            return categoryRepository.findByCollaborator_IdAndNameContainingIgnoreCase(collaboratorId, name);
        }
        return categoryRepository.findByCollaborator_Id(collaboratorId);
    }

    public List<ProductResponseDTO> getProductsByCollaborator(Long collaboratorId, String name) {
        // 1. Vérifier que le collaborateur existe
        if (!collaboratorRepository.existsById(collaboratorId)) {
            throw new CollaboratorNotFoundException("Collaborator " + collaboratorId + " not found");
        }

        // 2. Récupérer les produits selon les filtres
        List<Product> products;
        if (name != null && !name.isBlank()) {
            products = productRepository.findByCollaboratorIdAndNameContainingIgnoreCase(collaboratorId, name);
        } else {
            products = productRepository.findByCollaboratorId(collaboratorId);
        }

        // 3. Convertir en DTO (même logique que CategoryService)
        return products.stream().map(product -> {
            ProductResponseDTO dto = new ProductResponseDTO();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setPrice(product.getPrice());
            dto.setQuantity(product.getQuantity());

            if (product.getImages() != null) {
                dto.setImageUrls(product.getImages().stream()
                        .map(img -> img.getImage_url()).toList());
            }
            if (product.getCategory() != null) {
                dto.setCategory(new ProductResponseDTO.CategoryInfo(
                        product.getCategory().getId(),
                        product.getCategory().getName()
                ));
            }
            if (product.getCollaborator() != null) {
                dto.setCollaborator(new ProductResponseDTO.CollaboratorInfo(
                        product.getCollaborator().getId(),
                        product.getCollaborator().getName()
                ));
            }
            return dto;
        }).toList();
    }
}