package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.CategoryRequestDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Product;
import com.backend.wasilatti.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories(){
        var response = new ApiResponse<List<Category>>(true, "success", categoryService.getAllCategories());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> createCategory(
            @RequestBody @Valid CategoryRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "Category created successfully",
                        categoryService.createCategory(request)
                ));
    }

    @PostMapping("/{categoryId}/products/{productId}")
    public ResponseEntity<ApiResponse<Void>> addProductToCategory(
            @PathVariable Long categoryId,
            @PathVariable Long productId) {
        categoryService.addProductToCategory(categoryId, productId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Product added to category"));
    }


    // 1. Correction du PUT (Mise à jour complète via DTO)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable Long id,
            @RequestBody @Valid CategoryRequestDTO request) {

        var response = new ApiResponse<Category>(
                true,
                "Category updated successfully",
                this.categoryService.updateCategory(id, request)
        );
        return ResponseEntity.ok(response);
    }

    // 2. Ajout du PATCH (Mise à jour partielle dynamique)
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> patchCategory(
            @PathVariable Long id,
            @RequestBody CategoryRequestDTO request) { // Pas de @Valid strict ici pour permettre des champs null

        var response = new ApiResponse<Category>(
                true,
                "Category partially updated successfully",
                this.categoryService.patchCategory(id, request)
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id){
        this.categoryService.deleteCategoryById(id);
        var response = new ApiResponse<Void>(true, "Category deleted successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{categoryId}/products/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeProductFromCategory(
            @PathVariable Long categoryId,
            @PathVariable Long productId) {
        categoryService.removeProductFromCategory(categoryId, productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product removed from category"));
    }

    // GET /categories/{id}/products  or  ?name=foo  for filtering
    // GET /categories/{id}/products or ?name=foo for filtering

    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<ProductResponseDTO>>> getProductsByCategory(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long collaboratorId) {

        // 1. Appel de la méthode DTO que vous avez ajoutée dans le Service
        List<ProductResponseDTO> productsDTO = categoryService.getProductsByCategoryAndCollaboratorDTO(id, name, collaboratorId);

        // 2. Retour de la réponse proprement formatée avec les DTOs
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Products retrieved successfully",
                productsDTO
        ));
    }


}
