package com.backend.wasilatti.model.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name="image")
public class Image extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String image_url;

    private String publicId;

    @ManyToOne
    @JoinColumn(name = "product_id") //this column called product_id
    @JsonBackReference //to avoid the infinite loop, secondary side
    private Product product;

    @OneToOne(mappedBy = "image")          // matches Category.image field
    @JsonBackReference("category-image")
    private Category category;

    @OneToOne(mappedBy = "image")          // matches Collaborator.image field
    @JsonBackReference("collaborator-image")
    private Collaborator collaborator;


}

