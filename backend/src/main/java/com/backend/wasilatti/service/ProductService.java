package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.request.CategoryRequestDTO;
import com.backend.wasilatti.dto.request.ProductRequestDTO;
import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.exception.CategoryNotFoundException;
import com.backend.wasilatti.exception.CollaboratorNotFoundException; // créez cette exception
import com.backend.wasilatti.exception.ProductNotFoundException;
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Collaborator;
import com.backend.wasilatti.model.entity.Product;
import com.backend.wasilatti.repository.CartItemRepository;
import com.backend.wasilatti.repository.CategoryRepository;
import com.backend.wasilatti.repository.CollaboratorRepository;
import com.backend.wasilatti.repository.OrderItemRepository;
import com.backend.wasilatti.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          CollaboratorRepository collaboratorRepository,
                          CartItemRepository cartItemRepository,
                          OrderItemRepository orderItemRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.collaboratorRepository = collaboratorRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // ── Méthode utilitaire : convertit Product → ProductResponseDTO ──
    private ProductResponseDTO toDTO(Product product) {
        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setBrand(product.getBrand());
        dto.setPrice(product.getPrice());
        dto.setQuantity(product.getQuantity());
        dto.setInPromotion(product.isInPromotion());
        dto.setSizes(product.getSizes());
        dto.setPromotionPercentage(product.getPromotionPercentage());

        // Images
        if (product.getImages() != null) {
            dto.setImageUrls(
                    product.getImages().stream()
                            .map(img -> img.getImage_url())
                            .toList()
            );
        }

        // ← Catégorie
        if (product.getCategory() != null) {
            dto.setCategory(new ProductResponseDTO.CategoryInfo(
                    product.getCategory().getId(),
                    product.getCategory().getName()
            ));
        }

        // ← Collaborateur
        if (product.getCollaborator() != null) {
            dto.setCollaborator(new ProductResponseDTO.CollaboratorInfo(
                    product.getCollaborator().getId(),
                    product.getCollaborator().getName()
            ));
        }

        // ← Dépôt
        dto.setDepotAddress(product.getDepotAddress());
        dto.setDepotLatitude(product.getDepotLatitude());
        dto.setDepotLongitude(product.getDepotLongitude());

        return dto;
    }

    // ── GET ALL ──
    public List<ProductResponseDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ── GET ONE ──
    public ProductResponseDTO getOneProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product with id " + id + " not found"));
        return toDTO(product);
    }

    // ── CREATE ──
    public ProductResponseDTO createProduct(ProductRequestDTO request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setInPromotion(request.isInPromotion());
        product.setPromotionPercentage(request.getPromotionPercentage());

        // ← Catégorie
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException("Category not found"));
            product.setCategory(category);
        }

        // ← Collaborateur
        if (request.getCollaboratorId() != null) {
            Collaborator collaborator = collaboratorRepository.findById(request.getCollaboratorId())
                    .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator not found"));
            product.setCollaborator(collaborator);
        }
        if (request.getSizes() != null) {
            product.setSizes(request.getSizes());
        }

        // ← Dépôt
        product.setDepotAddress(request.getDepotAddress());
        product.setDepotLatitude(request.getDepotLatitude());
        product.setDepotLongitude(request.getDepotLongitude());

        return toDTO(productRepository.save(product));
    }

    // ── DELETE ──
    @Transactional
    public void deletedProductById(Long id) {
        productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product " + id + " not found"));
        
        cartItemRepository.deleteAllByProductId(id);
        orderItemRepository.deleteAllByProductId(id);
        
        productRepository.deleteById(id);
    }

    // ── UPDATE ──
    public ProductResponseDTO updateProduct(Long id, ProductRequestDTO request) {
        Product savedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product " + id + " not found"));

        savedProduct.setName(request.getName());
        savedProduct.setPrice(request.getPrice());
        savedProduct.setDescription(request.getDescription());
        savedProduct.setQuantity(request.getQuantity());
        savedProduct.setBrand(request.getBrand());
        savedProduct.setInPromotion(request.isInPromotion());
        savedProduct.setPromotionPercentage(request.getPromotionPercentage());

        // ← Catégorie
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException("Category not found"));
            savedProduct.setCategory(category);
        }

        // ← Collaborateur
        if (request.getCollaboratorId() != null) {
            Collaborator collaborator = collaboratorRepository.findById(request.getCollaboratorId())
                    .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator not found"));
            savedProduct.setCollaborator(collaborator);
        }
        if (request.getSizes() != null) {
            savedProduct.setSizes(request.getSizes());
        }

        // ← Dépôt
        savedProduct.setDepotAddress(request.getDepotAddress());
        savedProduct.setDepotLatitude(request.getDepotLatitude());
        savedProduct.setDepotLongitude(request.getDepotLongitude());

        return toDTO(productRepository.save(savedProduct));
    }

    public ProductResponseDTO patchProduct(Long id, ProductRequestDTO request) {
        // Récupérer l'entité brute directement de la base de données
        Product savedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product " + id + " not found"));

        // Mise à jour partielle des champs textuels
        if (request.getName() != null) {
            savedProduct.setName(request.getName());
        }
        if (request.getDescription() != null) {
            savedProduct.setDescription(request.getDescription());
        }
        if (request.getBrand() != null) {
            savedProduct.setBrand(request.getBrand());
        }

        // Pour les objets Double (nullable)
        if (request.getPrice() != null) {
            savedProduct.setPrice(request.getPrice());
        }

        // Pour les types primitifs (int/boolean), attention : ils ont une valeur par défaut (0 / false)
        // On met à jour si la valeur fournie est cohérente avec un changement voulu
        if (request.getQuantity() > 0) {
            savedProduct.setQuantity(request.getQuantity());
        }

        // Note : Pour le boolean 'inPromotion', s'il est à false par défaut dans le DTO,
        // il écrasera la valeur existante. Si vous voulez un contrôle précis, il faudrait utiliser un objet 'Boolean' au lieu du type primitif 'boolean'.
        savedProduct.setInPromotion(request.isInPromotion());
        if (request.getPromotionPercentage() > 0) {
            savedProduct.setPromotionPercentage(request.getPromotionPercentage());
        }

        // Relations
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException("Category not found"));
            savedProduct.setCategory(category);
        }

        if (request.getCollaboratorId() != null) {
            Collaborator collaborator = collaboratorRepository.findById(request.getCollaboratorId())
                    .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator " + request.getCollaboratorId() + " not found"));
            savedProduct.setCollaborator(collaborator);
        }

        if (request.getSizes() != null && !request.getSizes().isEmpty()) {
            savedProduct.setSizes(request.getSizes());
        }

        // ← Dépôt
        if (request.getDepotAddress() != null) {
            savedProduct.setDepotAddress(request.getDepotAddress());
        }
        if (request.getDepotLatitude() != null) {
            savedProduct.setDepotLatitude(request.getDepotLatitude());
        }
        if (request.getDepotLongitude() != null) {
            savedProduct.setDepotLongitude(request.getDepotLongitude());
        }

        // Sauvegarde et retour du DTO
        return toDTO(productRepository.save(savedProduct));
    }
}