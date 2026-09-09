package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.CollaboratorRequestDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Collaborator;
import com.backend.wasilatti.service.CollaboratorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/collaborators")
public class CollaboratorController {

    private final CollaboratorService collaboratorService;

    public CollaboratorController(CollaboratorService collaboratorService) {
        this.collaboratorService = collaboratorService;
    }

    // GET /collaborators  or  GET /collaborators?name=foo
    @GetMapping
    public ResponseEntity<ApiResponse<List<Collaborator>>> getAllCollaborators(
            @RequestParam(required = false) String name) {

        List<Collaborator> result = (name != null && !name.isBlank())
                ? collaboratorService.searchCollaboratorsByName(name)
                : collaboratorService.getAllCollaborators();

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Collaborator>> getCollaboratorById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                collaboratorService.getCollaboratorById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Collaborator>> createCollaborator(
            @RequestBody @Valid CollaboratorRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Collaborator created successfully",
                        collaboratorService.createCollaborator(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Collaborator>> updateCollaborator(
            @PathVariable Long id,
            @RequestBody @Valid CollaboratorRequestDTO request) {

        return ResponseEntity.ok(new ApiResponse<>(true, "Collaborator updated successfully",
                collaboratorService.updateCollaborator(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCollaborator(@PathVariable Long id) {
        collaboratorService.deleteCollaborator(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Collaborator deleted successfully"));
    }

    // GET /collaborators/{id}/categories  or  ?name=foo  for filtering
    @GetMapping("/{id}/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategoriesByCollaborator(
            @PathVariable Long id,
            @RequestParam(required = false) String name) {

        return ResponseEntity.ok(new ApiResponse<>(true, "Success",
                collaboratorService.getCategoriesByCollaborator(id, name)));
    }

    // POST /collaborators/{collaboratorId}/categories/{categoryId}
    @PostMapping("/{collaboratorId}/categories/{categoryId}")
    public ResponseEntity<ApiResponse<Collaborator>> addCategoryToCollaborator(
            @PathVariable Long collaboratorId,
            @PathVariable Long categoryId) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Category added to collaborator",
                        collaboratorService.addCategoryToCollaborator(collaboratorId, categoryId)));
    }

    // DELETE /collaborators/{collaboratorId}/categories/{categoryId}
    @DeleteMapping("/{collaboratorId}/categories/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> removeCategoryFromCollaborator(
            @PathVariable Long collaboratorId,
            @PathVariable Long categoryId) {

        collaboratorService.removeCategoryFromCollaborator(collaboratorId, categoryId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category removed from collaborator"));
    }

    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<ProductResponseDTO>>> getProductsByCollaborator(
            @PathVariable Long id,
            @RequestParam(required = false) String name) {

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Products retrieved successfully",
                collaboratorService.getProductsByCollaborator(id, name)
        ));
    }
}