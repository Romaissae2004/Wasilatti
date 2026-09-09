package com.backend.wasilatti.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.backend.wasilatti.model.entity.AppUser;

import java.util.Date;
import java.util.UUID;


@Component
public class JWTUtil {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expire.access}")
    private long expireAccessToken;

    @Value("${jwt.expire.refresh}")
    private long expireRefreshToken;

    public static final String AUTH_HEADER = "Authorization";
    public static final String PREFIX      = "Bearer ";

    //Si le secret est absent ou faible, l'app refuse de démarrer.
    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.trim().length() < 32)
            throw new IllegalStateException(
                    "JWT_SECRET trop court ! Minimum 32 caractères requis.");
    }

    public String getSecret()             { return secret; }
    public long   getExpireAccessToken()  { return expireAccessToken; }
    public long   getExpireRefreshToken() { return expireRefreshToken; }

    public String generateAccessToken(AppUser appUser, String issuer) {
        Algorithm algorithm = Algorithm.HMAC256(secret);

        com.auth0.jwt.JWTCreator.Builder jwtBuilder = JWT.create()
                .withClaim("typ", "access")
                .withSubject(appUser.getUsername())
                .withClaim("email", appUser.getEmail())
                .withExpiresAt(new Date(System.currentTimeMillis() + expireAccessToken))
                .withIssuer(issuer)
                .withClaim("roles",
                        appUser.getAppRoles()
                                .stream()
                                .map(r -> r.getRoleName())
                                .toList());

        if (appUser.getCollaborator() != null) {
            jwtBuilder.withClaim("collaboratorId", appUser.getCollaborator().getId());
        }

        return jwtBuilder.sign(algorithm);
    }

    public String generateRefreshToken(String username, String issuer) {
        Algorithm algorithm = Algorithm.HMAC256(secret);

        return JWT.create()
                .withClaim("typ", "refresh")
                .withJWTId(UUID.randomUUID().toString()) //ajoute un champ standard dans le JWT appelé jti (JWT ID) qui génère un identifiant unique aléatoire Donc chaque refresh token aura son propre ID
                .withSubject(username)
                .withExpiresAt(new Date(System.currentTimeMillis() + expireRefreshToken))
                .withIssuer(issuer)
                .sign(algorithm);
    }
    public boolean isRefreshToken(DecodedJWT jwt) {
        return "refresh".equals(jwt.getClaim("typ").asString());
    }
}