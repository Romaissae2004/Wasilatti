package com.backend.wasilatti.service;

import com.backend.wasilatti.exception.InvalidTokenException;
import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.model.entity.PasswordResetToken;
import com.backend.wasilatti.repository.AppUserRepository;
import com.backend.wasilatti.repository.PasswordResetRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.Date;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PasswordResetService {

    private final AppUserRepository appUserRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordFrontendUrl;

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?!.*\\s)(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!*\\-_]).{8,255}$"
    );

    public PasswordResetService(AppUserRepository appUserRepository,
                                PasswordResetRepository passwordResetRepository,
                                JavaMailSender mailSender,
                                PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordResetRepository = passwordResetRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Supprime toutes les 30 minutes les tokens de réinitialisation expirés.
     */
    @Scheduled(fixedRate = 30 * 60 * 1000)
    public void cleanExpiredResetTokens() {
        passwordResetRepository.deleteExpiredTokens(new Date());
    }

    /**
     * Étape 1 — Envoyer un email avec le lien de réinitialisation.
     */
    public void sendResetEmail(String email) {
        // Correction : On extrait l'AppUser de l'Optional. S'il n'existe pas, on récupère null.
        AppUser appUser = appUserRepository.findByEmail(email).orElse(null);

        // Sécurité : évite l'énumération des comptes existants côté API
        if (appUser == null) {
            return;
        }

        String token = UUID.randomUUID().toString();
        Date expiresAt = new Date(System.currentTimeMillis() + 15 * 60 * 1000);

        passwordResetRepository.save(new PasswordResetToken(token, email, expiresAt));

        String resetLink = resetPasswordFrontendUrl + "?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Wasilatti - Reinitialisation de votre mot de passe");
        message.setText(
                "Bonjour,\n\n" +
                        "Cliquez sur le lien suivant pour reinitialiser votre mot de passe :\n\n" +
                        resetLink + "\n\n" +
                        "Ce lien est valable 15 minutes.\n\n" +
                        "Si vous n'avez pas demande cette reinitialisation, ignorez cet email."
        );
        mailSender.send(message);
    }

    /**
     * Étape 2 — Réinitialiser le mot de passe avec le token valide.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // 1. Validation de la complexité du mot de passe
        if (newPassword == null || !PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new InvalidTokenException(
                    "Mot de passe invalide — doit contenir au moins : " +
                            "1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial (@#$%^&+=!*-_), " +
                            "entre 8 et 255 caractères, sans espaces"
            );
        }

        // 2. Récupération et vérification de la validité du Token
        PasswordResetToken resetToken = passwordResetRepository.findByToken(token);

        if (resetToken == null) {
            throw new InvalidTokenException("Token invalide");
        }
        if (resetToken.isUsed()) {
            throw new InvalidTokenException("Token déjà utilisé");
        }
        if (resetToken.getExpiresAt().before(new Date())) {
            throw new InvalidTokenException("Token expiré, veuillez refaire la demande");
        }

        // 3. Récupération de l'utilisateur lié au token
        // Correction : Utilisation de .orElseThrow() pour lever proprement l'exception si l'Optional est vide
        AppUser appUser = appUserRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new InvalidTokenException("Aucun compte associé à cet email"));

        // 4. Mise à jour du mot de passe
        appUser.setPassword(passwordEncoder.encode(newPassword));
        appUserRepository.save(appUser);

        // 5. Invalidation du token pour empêcher une seconde réutilisation
        resetToken.setUsed(true);
        passwordResetRepository.save(resetToken);
    }
}