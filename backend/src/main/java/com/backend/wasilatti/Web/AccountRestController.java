package com.backend.wasilatti.Web;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.backend.wasilatti.security.JWTUtil;
import com.backend.wasilatti.service.AccountService;
import com.backend.wasilatti.service.OAuth2CodeService;
import com.backend.wasilatti.service.PasswordResetService;
import com.backend.wasilatti.service.TokenBlacklistService;
import com.backend.wasilatti.model.entity.AppRole;
import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.exception.InvalidTokenException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.*;

import jakarta.validation.Valid;

@RestController
public class AccountRestController {
    private final AccountService accountService;
    private final TokenBlacklistService tokenBlacklistService;
    private final PasswordResetService passwordResetService;
    private final JWTUtil jwtUtil;
    private final OAuth2CodeService oauth2CodeService;

    public AccountRestController(AccountService accountService,TokenBlacklistService tokenBlacklistService,PasswordResetService passwordResetService,JWTUtil jwtUtil, OAuth2CodeService oauth2CodeService) {
        this.accountService = accountService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.passwordResetService = passwordResetService;
        this.jwtUtil = jwtUtil;
        this.oauth2CodeService = oauth2CodeService;
    }

    @PostMapping({"/register", "/auth/register"})
    public AppUser register(@Valid @RequestBody AppUser appUser) {
        //return accountService.addNewUser(appUser);
        return accountService.registerUser(appUser,true);
    }

    @GetMapping(path = "/users")
    /*je protège mes ressources*/
    @PreAuthorize("hasAuthority('ADMIN')")/*vérification avant l'éxcecution,qd vous appelez cette méthode n'est accessible que pour les users qui ont le role USER */
    //je peux consulter la liste des users, une méthode qui retourne une liste de users , je veux connaitre tt les users
    public List<AppUser> appUsers() {
        return accountService.listUsers();
    }

    /*je peux ajouter un user*/
    @PostMapping(path = "/users")
    @PreAuthorize("hasAuthority('ADMIN')")/*qd vous appelez cette méthode n'est accessible que pour les users qui ont le role ADMIN */
    public AppUser saveUser(@Valid @RequestBody AppUser appUser) {
        /* @RequestBody: pour dire que les données de user sont ds le body de la requete*/
        return accountService.registerUser(appUser,true); /* méthode addNewUser encode le mdp */
    }

    @PostMapping(path = "/roles")
    @PreAuthorize("hasAuthority('ADMIN')") /* @PostAuthorize("hasAuthority('ADMIN')")/ Remplacer @PostAuthorize par @PreAuthorize*/
    public AppRole saveRole(@Valid @RequestBody AppRole appRole) {
        return accountService.addNewRole(appRole);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(path = "/addRoleToUser")
    public void addRoleToUser(@Valid @RequestBody RoleUserForm roleUserForm) { /* un objet de type RoleUserForm qui a 2 attributs et faire cette classe en dehors de tt ca créer cette clase*/
        accountService.addRoleToUser(roleUserForm.getUsername(), roleUserForm.getRoleName());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(path = "/removeRoleFromUser")
    public void removeRoleFromUser(@Valid @RequestBody RoleUserForm roleUserForm) {
        accountService.removeRoleFromUser(roleUserForm.getUsername(), roleUserForm.getRoleName());
    }

    @GetMapping(path="/profile")
    /*connaitre l'user authentifié par principal*/
    public AppUser profile(Principal principal){
        return accountService.loadUserByUsername(principal.getName());
    }


    /*si accessToken n'est pas valable moi l'user que j'ai le refreshToken je dois envois une requete get vers ce refreshToken */
    @PostMapping(path = {"/refreshToken", "/auth/refreshToken"})
    public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String authToken = request.getHeader(JWTUtil.AUTH_HEADER);/*lire le header de token*/
        if (authToken != null && authToken.startsWith(JWTUtil.PREFIX)) {
            /*jwt est un refreshToken*/
            String jwt = authToken.substring(JWTUtil.PREFIX.length());/*je récupère le refreshToken*/
            // 1. Vérifier si déjà blacklisté ,Vérifier que le refresh token n'est pas blacklisté
            if (tokenBlacklistService.isBlacklisted(jwt)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Refresh token révoqué");
                return;
            }
            try {
                Algorithm algorithm = Algorithm.HMAC256(jwtUtil.getSecret());
                JWTVerifier jwtVerifier = JWT.require(algorithm).build();
                DecodedJWT decodedJWT = jwtVerifier.verify(jwt);

                if (!jwtUtil.isRefreshToken(decodedJWT)) {
                    throw new InvalidTokenException("Ce n'est pas un refresh token");
                }

                String username = decodedJWT.getSubject();
                AppUser appUser = accountService.loadUserByUsername(username);/*je recharge l'user comme quoi s'il y a un role qui a changé je vais les prendre en considération et je l'envoie */

                // blacklister l'ANCIEN token AVANT de générer le nouveau
                tokenBlacklistService.blacklistToken(jwt, decodedJWT.getExpiresAt());

                /*je génère un nouveau access token ou je vais créer un accessToken dont lequel je vais mettre les roles et ts ce qu'il faut */
                String jwtAccessToken =
                        jwtUtil.generateAccessToken(
                                appUser,
                                request.getRequestURL().toString());

                String newRefreshToken =
                        jwtUtil.generateRefreshToken(
                                username,
                                request.getRequestURL().toString());

                /*envoyer ds la réponse*/
                Map<String, String> idToken = new HashMap<>();
                idToken.put("access-token", jwtAccessToken);
                //idToken.put("refresh-token", jwt);
                idToken.put("refresh-token", newRefreshToken);
                response.setContentType("application/json");
                new ObjectMapper().writeValue(response.getOutputStream(), idToken);

            } catch (Exception e) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                        "Refresh token invalide ou expiré");
            }
        } else {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Refresh token requis");
        }
    }

    @PostMapping("/oauth2/token")
    public Map<String, String> exchangeOAuth2Code(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

// Après :
        if (body == null || !body.containsKey("code") || body.get("code") == null || body.get("code").isBlank()) {
            throw new InvalidTokenException("Code OAuth2 manquant");
        }
        String username = oauth2CodeService.consumeCode(body.get("code"));
        AppUser appUser = accountService.loadUserByUsername(username);

        String accessToken =
                jwtUtil.generateAccessToken(appUser,
                        request.getRequestURL().toString());

        String refreshToken =
                jwtUtil.generateRefreshToken(
                        appUser.getUsername(),
                        request.getRequestURL().toString());

        return Map.of(
                "access-token",  accessToken,
                "refresh-token", refreshToken
        );
    }

    //C’est une API appelée quand l’utilisateur clique sur logout
    @PostMapping({"/logout", "/auth/logout"})
    public Map<String, String> logout(HttpServletRequest request,
                                      @RequestBody(required = false) Map<String, String> body) {
        String authToken = request.getHeader(JWTUtil.AUTH_HEADER);
        String rawRefreshToken = request.getHeader("X-Refresh-Token");
        if (rawRefreshToken == null && body != null && body.containsKey("refreshToken")) {
            rawRefreshToken = body.get("refreshToken");
        }
        final String refreshTokenRaw = rawRefreshToken;
        Map<String, String> response = new HashMap<>();

        if (authToken != null && authToken.startsWith(JWTUtil.PREFIX)) {
            try {
                Algorithm algorithm = Algorithm.HMAC256(jwtUtil.getSecret());
                JWTVerifier jwtVerifier = JWT.require(algorithm).build();

                // Blacklister l'access token avec sa date d'expiration j'ajoutes le token dans la blacklist même s’il n’est pas expiré,il devient inutilisable
                String jwt = authToken.substring(JWTUtil.PREFIX.length());
                DecodedJWT decodedJWT = jwtVerifier.verify(jwt);
                tokenBlacklistService.blacklistToken(jwt, decodedJWT.getExpiresAt());

                // Blacklister le refresh token avec OU sans préfixe Bearer (header OU body) s’il est fourni et valide
                if (refreshTokenRaw != null) {
                    String refreshJwt = refreshTokenRaw.startsWith(JWTUtil.PREFIX)
                            ? refreshTokenRaw.substring(JWTUtil.PREFIX.length())
                            : refreshTokenRaw;
                    try {
                        DecodedJWT decodedRefresh = jwtVerifier.verify(refreshJwt);
                        tokenBlacklistService.blacklistToken(refreshJwt, decodedRefresh.getExpiresAt());
                    } catch (Exception ignored) {
                        // refresh token invalide ou déjà expiré — on ignore
                    }
                }

                response.put("message", "Déconnexion réussie");
            } catch (com.auth0.jwt.exceptions.JWTVerificationException e) {
                throw new InvalidTokenException("Token invalide");            }
        } else {
            throw new InvalidTokenException("Token manquant");        }
        return response;
    }

    // Étape 1 — demander réinitialisation
    @PostMapping({"/forgot-password", "/auth/forgot-password"})
    public Map<String, String> forgotPassword(@RequestBody Map<String, String> body) {

        passwordResetService.sendResetEmail(body.get("email"));
        return Map.of("message", "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé");
    }
    // Étape 2 — réinitialiser le mot de passe
    @PostMapping({"/reset-password", "/auth/reset-password"})
    public Map<String, String> resetPassword(@RequestBody Map<String, String> body) {
        passwordResetService.resetPassword(body.get("token"), body.get("newPassword"));
        return Map.of("message", "Mot de passe réinitialisé avec succès");
    }
}