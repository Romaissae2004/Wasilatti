package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.CategoryRequestDTO;
import com.backend.wasilatti.dto.request.ProductRequestDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.ProductResponseDTO; // ← Import du bon DTO
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Product;
import com.backend.wasilatti.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponseDTO>>> getProducts() { // ← Modifié
        var response = new ApiResponse<List<ProductResponseDTO>>(true, "Success", productService.getAllProducts());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponseDTO>> createProduct( // ← Modifié
                                                                          @RequestBody @Valid ProductRequestDTO request) {
        var response = new ApiResponse<ProductResponseDTO>(true, "Success", productService.createProduct(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        this.productService.deletedProductById(id);
        var response = new ApiResponse<Void>(true, "Product deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponseDTO>> updateProduct( // ← Modifié
                                                                          @PathVariable Long id,
                                                                          @RequestBody @Valid ProductRequestDTO request) { // ← Changé Product en ProductRequestDTO
        var response = new ApiResponse<ProductResponseDTO>(
                true,
                "Product updated successfully",
                this.productService.updateProduct(id, request)
        );
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponseDTO>> patchProduct(
            @PathVariable Long id,
            @RequestBody ProductRequestDTO request) {

        var response = new ApiResponse<ProductResponseDTO>(
                true,
                "Product partially updated successfully",
                this.productService.patchProduct(id, request)
        );
        return ResponseEntity.ok(response);
    }
}