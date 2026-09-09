package com.backend.wasilatti.service;

import com.backend.wasilatti.model.entity.BlacklistedToken;
import com.backend.wasilatti.repository.BlacklistedTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service //c’est une classe métier (logique de mon app)
//Elle sert à :ajouter un token à la blacklist,vérifier un token et nettoyer la base automatiquement
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository; //Connexion avec la base alors j'utilises le repository pour parler avec la DB

    public TokenBlacklistService(BlacklistedTokenRepository blacklistedTokenRepository) {
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    // ajouter un token à la blacklist,Qd je fais logout j'ajoutes le token dans la base
    public void blacklistToken(String token, Date expiresAt) {
        blacklistedTokenRepository.save(new BlacklistedToken(token, expiresAt));
    }

    // vérifier si un token est blacklisté,true:token interdit,false:token valide , utilisé ds mon filtre JWT
    public boolean isBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }

    // nettoyer automatiquement les tokens expirés toutes les heures,Cette méthode se lance automatiquement toutes les heures ,supprimer les tokens expirés de la base
    @Scheduled(fixedRate = 3600000)
    public void cleanExpiredTokens() {
        blacklistedTokenRepository.deleteExpiredTokens(new Date());
    }
}

/*Ce service fait 3 choses :
ajoute un token blacklisté,vérifie un token et nettoye la base automatiquement
utilisateur logout
→ blacklistToken()
utilisateur refait une requête
→ isBlacklisted().si true accès refusé
*/