package com.backend.wasilatti.model.entity;

import com.backend.wasilatti.validation.ValidPromotion;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name="product")
@ValidPromotion
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @NotBlank(message = "Product name cannot be empty")
    private String name;

    @NotBlank(message = "Description cannot be empty")
    private String description;

    private String brand;

    @NotNull( message = "Price is required")
    @Positive( message = "Price must be positive")
    private Double price;

    @Positive( message = "Quantity cannot be negative")
    private int quantity;

    private boolean inPromotion;


    private int promotionPercentage;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference //to avoid the infinite loop, primary side
    private List<Image> images;

    @ManyToOne
    @JoinColumn(name = "category_id")
    @JsonBackReference("category-products")  // same name
    private Category category;

    @ManyToOne
    @JoinColumn(name = "collaborator_id")
    @JsonBackReference("collaborator-products")
    private Collaborator collaborator;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_sizes", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "size")
    private List<String> sizes;

    // ── Dépôt de stockage (visible livreur/admin uniquement) ──
    private String depotAddress;
    private Double depotLatitude;
    private Double depotLongitude;

}
