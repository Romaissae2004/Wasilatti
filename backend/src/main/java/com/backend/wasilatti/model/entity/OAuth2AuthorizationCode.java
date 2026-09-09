package com.backend.wasilatti.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

public class OAuth2AuthorizationCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private String username;
    private Date expiresAt;
    private boolean used = false;

    public OAuth2AuthorizationCode(String code, String username, Date expiresAt) {
        this.code = code;
        this.username = username;
        this.expiresAt = expiresAt;
        this.used = false;
    }
}