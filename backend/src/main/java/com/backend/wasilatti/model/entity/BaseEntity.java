package com.backend.wasilatti.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@MappedSuperclass // abstract est préférable pour une MappedSuperclass
public abstract class BaseEntity {

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /*
    @PrePersist : Dit à Hibernate : "Juste avant d'exécuter le INSERT en SQL,
     exécute cette méthode". Cela garantit que createdAt n'est jamais nul.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /*
    @PreUpdate : Dit à Hibernate : "Juste avant d'exécuter un UPDATE,
     mets à jour la date".
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }


}

