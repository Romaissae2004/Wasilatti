package com.backend.wasilatti.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name="collaborator")
public class Collaborator extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToOne
    @JoinColumn(name = "image_id")
    @JsonManagedReference("collaborator-image")
    private Image image;

    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "user_id")
    private AppUser user;

    @OneToMany(mappedBy = "collaborator", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonIgnoreProperties({"collaborator"})
    private List<Category> categories;

    @OneToMany(mappedBy = "collaborator", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonManagedReference("collaborator-products")
    private List<Product> products;
}