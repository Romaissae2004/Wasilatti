package com.backend.wasilatti.controller;


import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.model.entity.Image;
import com.backend.wasilatti.service.ImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class ImageController {
    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @GetMapping("/products/{productId}/images")
    public ResponseEntity<ApiResponse<List<Image>>> getImagesByProduct(@PathVariable Long productId){
        var response = new ApiResponse<List<Image>>(true,"Success",  imageService.getAllImages(productId));
        return ResponseEntity.ok(response);
    }


    @PostMapping("/products/{productId}/images")
    public ResponseEntity<ApiResponse<List<Image>>> addMultipleImagesToProduct(
            @PathVariable Long productId,
            @RequestParam("files") List<MultipartFile> files) {

        var response = new ApiResponse<>(
                true,
                "Success",
                imageService.addMultipleImagesToProduct(productId, files)
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/products/{productId}/images/{imageId}")
    public ResponseEntity<ApiResponse<Image>> updateImage(
            @PathVariable Long productId,
            @PathVariable Long imageId,
            @RequestParam("file") MultipartFile file) {

        var response = new ApiResponse<Image>(
                true,
                "Image updated successfully",
                imageService.updateImage(productId, imageId, file)
        );
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/products/{productId}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImageFromProduct(@PathVariable Long productId, @PathVariable Long imageId) {
        this.imageService.deleteImageFromProduct(productId, imageId);
        var response = new ApiResponse<Void>(true,"Image deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories/{categoryId}/image")
    public ResponseEntity<ApiResponse<Image>> addImageToCategory(
            @PathVariable Long categoryId,
            @RequestParam("file") MultipartFile file) {

        var response = new ApiResponse<>(
                true,
                "Category image uploaded successfully",
                imageService.addImageToCategory(categoryId, file)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/categories/{categoryId}/image")
    public ResponseEntity<ApiResponse<Void>> deleteImageFromCategory(
            @PathVariable Long categoryId) {

        imageService.deleteImageFromCategory(categoryId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category image deleted successfully"));
    }

    @PutMapping("/categories/{categoryId}/image")
    public ResponseEntity<ApiResponse<Image>> updateImageFromCategory(
            @PathVariable Long categoryId,
            @RequestParam("file") MultipartFile file) {

        var response = new ApiResponse<>(
                true,
                "Category image updated successfully",
                imageService.updateImageFromCategory(categoryId, file)
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/collaborators/{collaboratorId}/image")
    public ResponseEntity<ApiResponse<Image>> addImageToCollaborator(
            @PathVariable Long collaboratorId,
            @RequestParam("file") MultipartFile file) {

        var response = new ApiResponse<>(
                true,
                "Collaborator image uploaded successfully",
                imageService.addImageToCollaborator(collaboratorId, file)
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
