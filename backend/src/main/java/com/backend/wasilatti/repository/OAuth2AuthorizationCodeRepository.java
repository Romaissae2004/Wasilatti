package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.OAuth2AuthorizationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;

public interface OAuth2AuthorizationCodeRepository
        extends JpaRepository<OAuth2AuthorizationCode, Long> {

    OAuth2AuthorizationCode findByCode(String code);

    @Modifying
    @Transactional
    @Query("DELETE FROM OAuth2AuthorizationCode c WHERE c.expiresAt < :now")
    void deleteExpiredCodes(Date now);
}