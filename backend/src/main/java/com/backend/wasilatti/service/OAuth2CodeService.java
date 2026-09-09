package com.backend.wasilatti.service;

import com.backend.wasilatti.exception.InvalidTokenException;
import com.backend.wasilatti.model.entity.OAuth2AuthorizationCode;
import com.backend.wasilatti.repository.OAuth2AuthorizationCodeRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

@Service
public class OAuth2CodeService {

    private final OAuth2AuthorizationCodeRepository repo;

    public OAuth2CodeService(OAuth2AuthorizationCodeRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public String generateCode(String username) {
        String code = UUID.randomUUID().toString().replace("-", "");
        Date expiresAt = new Date(System.currentTimeMillis() + 2 * 60 * 1000);
        repo.save(new OAuth2AuthorizationCode(code, username, expiresAt));
        return code;
    }

    @Transactional
    public String consumeCode(String code) {
        OAuth2AuthorizationCode authCode = repo.findByCode(code);

        if (authCode == null)
            throw new InvalidTokenException("Code OAuth2 invalide");
        if (authCode.isUsed())
            throw new InvalidTokenException("Code OAuth2 déjà utilisé");
        if (authCode.getExpiresAt().before(new Date()))
            throw new InvalidTokenException("Code OAuth2 expiré");

        authCode.setUsed(true);
        repo.save(authCode);

        return authCode.getUsername();
    }

    @Scheduled(fixedRate = 10 * 60 * 1000)
    @Transactional
    public void cleanExpiredCodes() {
        repo.deleteExpiredCodes(new Date());
    }
}