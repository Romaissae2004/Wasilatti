package com.backend.wasilatti.service;

import com.backend.wasilatti.exception.CategoryNotFoundException;
import com.backend.wasilatti.exception.CollaboratorNotFoundException;
import com.backend.wasilatti.exception.ProductNotFoundException;
import com.backend.wasilatti.exception.ImageUrlNotFoundException;
import com.backend.wasilatti.model.entity.Category;
import com.backend.wasilatti.model.entity.Collaborator;
import com.backend.wasilatti.model.entity.Image;
import com.backend.wasilatti.model.entity.Product;
import com.backend.wasilatti.repository.CategoryRepository;
import com.backend.wasilatti.repository.CollaboratorRepository;
import com.backend.wasilatti.repository.ImageRepository;
import com.backend.wasilatti.repository.ProductRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ImageService {

    private final ImageRepository imageRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final Cloudinary cloudinary;

    public ImageService(ImageRepository imageRepository, ProductRepository productRepository, Cloudinary cloudinary, CategoryRepository categoryRepository, CollaboratorRepository collaboratorRepository) {
        this.imageRepository = imageRepository;
        this.productRepository = productRepository;
        this.cloudinary = cloudinary;
        this.categoryRepository = categoryRepository;
        this.collaboratorRepository = collaboratorRepository;
    }

    public List<Image> getAllImages(Long productId) {
        Product product = productRepository.findById(productId).orElseThrow(()->new ProductNotFoundException("Product not found"));
        return product.getImages();
    }

    /*
    public Image addImageToProduct(Long productId, String imageUrl) {
        Product product = productRepository.findById(productId).orElseThrow(()->new ProductNotFoundException("Product not found"));
        Image image = new Image();
        image.setImage_url(imageUrl);
        image.setProduct(product);

        return imageRepository.save(image);
    }**/

    public Image addImageToProduct(Long productId, MultipartFile file) {
        Product product = productRepository.findById(productId).orElseThrow(()->new ProductNotFoundException("Product not found"));

        try{
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                 file.getBytes(),
                ObjectUtils.emptyMap()
            );
            String imageUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            Image image = new Image();
            image.setImage_url(imageUrl);
            image.setPublicId(publicId);
            image.setProduct(product);

            return imageRepository.save(image);
        } catch (IOException e) {
            //to do an exception class
            throw new RuntimeException("Failed to upload image");
        }
    }

    //if the Image does not belong to this product
    public void deleteImageFromProduct(Long productId, Long imageId) {
        Image image = imageRepository.findById(imageId).orElseThrow(()->new ImageUrlNotFoundException("Image not found"));

        if (!image.getProduct().getId().equals(productId)) {
            throw new ImageUrlNotFoundException("Image does not belong to this product");
        }

        try {
            cloudinary.uploader().destroy(image.getPublicId(), ObjectUtils.emptyMap());
        } catch (Exception e) {
            //excetion class
            throw new RuntimeException("Failed to delete image from Cloudinary");
        }

        imageRepository.deleteById(imageId);
    }


    public List<Image> addMultipleImagesToProduct(Long productId, List<MultipartFile> files) {
        Product product = productRepository.findById(productId).orElseThrow(()->new ProductNotFoundException("Product not found"));

        List<Image> images = new ArrayList<>();

        for (MultipartFile file : files) {

            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.emptyMap()
                );

                String imageUrl = uploadResult.get("secure_url").toString();
                String publicId = uploadResult.get("public_id").toString();

                Image image = new Image();
                image.setImage_url(imageUrl);
                image.setPublicId(publicId);
                image.setProduct(product);

                images.add(imageRepository.save(image));

            } catch (Exception e) {
                //exception class
                throw new RuntimeException("Upload failed");
            }
        }

        return images;
    }

    public Image updateImage(Long productId, Long imageId, MultipartFile file) {
        // 1. Find the existing image
        Image existingImage = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));

        // 2. Delete old image from Cloudinary
        try {
            cloudinary.uploader().destroy(existingImage.getPublicId(), ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete old image from Cloudinary");
        }

        // 3. Upload new image to Cloudinary
        try {
            var uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            existingImage.setImage_url((String) uploadResult.get("url"));
            existingImage.setPublicId((String) uploadResult.get("public_id"));
            return imageRepository.save(existingImage);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload new image to Cloudinary");
        }
    }
    public Image addImageToCategory(Long categoryId, MultipartFile file) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found"));

        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.emptyMap()
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            Image image = new Image();
            image.setImage_url(imageUrl);
            image.setPublicId(publicId);

            Image savedImage = imageRepository.save(image);

            category.setImage(savedImage);
            categoryRepository.save(category);

            return savedImage;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload category image");
        }


    }

    public void deleteImageFromCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found"));

        Image image = category.getImage();
        if (image == null) {
            throw new RuntimeException("Category has no image to delete");
        }

        // Remove reference first to avoid FK constraint
        category.setImage(null);
        categoryRepository.save(category);

        // Delete from Cloudinary
        try {
            cloudinary.uploader().destroy(image.getPublicId(), ObjectUtils.emptyMap());
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete image from Cloudinary");
        }

        imageRepository.deleteById(image.getId());
    }

    public Image updateImageFromCategory(Long categoryId, MultipartFile file) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found"));

        Image existingImage = category.getImage();

        // Delete old image from Cloudinary if exists
        if (existingImage != null) {
            try {
                cloudinary.uploader().destroy(existingImage.getPublicId(), ObjectUtils.emptyMap());
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete old image from Cloudinary");
            }
        }

        // Upload new image
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.emptyMap()
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            if (existingImage != null) {
                // Reuse existing image entity
                existingImage.setImage_url(imageUrl);
                existingImage.setPublicId(publicId);
                return imageRepository.save(existingImage);
            } else {
                // Create new image entity
                Image newImage = new Image();
                newImage.setImage_url(imageUrl);
                newImage.setPublicId(publicId);
                Image savedImage = imageRepository.save(newImage);
                category.setImage(savedImage);
                categoryRepository.save(category);
                return savedImage;
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload new image to Cloudinary");
        }
    }

    public Image addImageToCollaborator(Long collaboratorId, MultipartFile file) {
        Collaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new CollaboratorNotFoundException("Collaborator not found"));

        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.emptyMap()
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            Image image = new Image();
            image.setImage_url(imageUrl);
            image.setPublicId(publicId);

            Image savedImage = imageRepository.save(image);

            collaborator.setImage(savedImage);
            collaboratorRepository.save(collaborator);

            return savedImage;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload category image");
        }


    }

}
