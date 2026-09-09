package com.backend.wasilatti.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/* une table en DB qui sert à bloquer des tokens JWT,qui garde les JWT invalidés pour empêcher leur réutilisation.
Normalement, un JWT reste valide jusqu’à sa date d’expiration
ms parfois tu veux le bloquer avant :utilisateur se déconnecte ,token volé , sécurité
Solution : blacklist (liste noire)
je me connectes → je reçois un JWT
je fais logout → mon token est ajouté ici
Si quelqu’un réutilise ce token → refusé à chaque requête:je vérifies si le token est dans la blacklist.si OUI alors accès refusé
C’est une table qui garde les JWT invalidés pour empêcher leur réutilisation=liste des tokens interdits*/
@Entity
@Data /*pour lire les valeurs*/
@NoArgsConstructor
@AllArgsConstructor  /*pour créer facilement un token blacklisté*/
public class BlacklistedToken {
    /*identifiant unique, auto-incrémenté*/
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*le JWT que je veux bloquer:pas de doublons et taille max du token*/
    /*TEXT au lieu de length=500 (un JWT peut faire 600-800+ chars)*/
    @Column(unique = true,columnDefinition = "TEXT" )
    private String token;

    /*utile pour savoir quand supprimer ce token,ne pas garder des données inutiles */
    private Date expiresAt;
    public BlacklistedToken(String token, Date expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }
}