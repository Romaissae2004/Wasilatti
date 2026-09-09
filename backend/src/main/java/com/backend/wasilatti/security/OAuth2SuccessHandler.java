package com.backend.wasilatti.security;

import com.backend.wasilatti.service.AccountService;
import com.backend.wasilatti.service.OAuth2CodeService;
import com.backend.wasilatti.model.entity.AppUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import java.util.UUID;

/*Mon code là c'est en fait le cerveau de ce qui se passe après une connexion avec Google
Il prend l’utilisateur Google et le transforme en utilisateur de mon app + génère un JWT
ce code s’exécute qd l’utilisateur fait : Se connecter avec Google et que ça réussit , Spring appelle: onAuthenticationSuccess(...)
Google sert juste pour l’authentification, puis tu passes en JWT comme ton système normal*/

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AccountService accountService;
    private final OAuth2CodeService oauth2CodeService;

    @Value("${app.frontend.oauth2-redirect-url}")
    private String oauth2RedirectUrl;

    public OAuth2SuccessHandler(AccountService accountService,OAuth2CodeService oauth2CodeService) {
        this.accountService = accountService;
        this.oauth2CodeService = oauth2CodeService;

    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        //je viens de Récupérer les infos depuis Google , email et le nom viennent directement de Google
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST,
                    "Email non fourni par le provider OAuth2");
            return;
        }
        if (name == null || name.isBlank()) {
            name = email.split("@")[0]; // fallback : partie locale de l'email
        }

        // vérifier si user existe déjà, sinon le créer
        AppUser appUser = accountService.loadUserByEmail(email);
        //il n’existe pas je le crées
        if (appUser == null) {
            AppUser newUser = new AppUser();

            String baseUsername = name.replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase();
            String username = resolveUniqueUsername(baseUsername);

            newUser.setUsername(username);
            //newUser.setUsername(name.replaceAll(" ", "_").toLowerCase());
            newUser.setEmail(email);
            //newUser.setPassword("GOOGLE_AUTH_" + email); // pas de mdp car connexion Google
            newUser.setPassword("OAUTH2_ONLY_" + UUID.randomUUID().toString().replace("-", ""));
            appUser = accountService.registerUser(newUser, false);

        }

        //Retourner les tokens client:Tu envoies : access-token,refresh-token
        /*Map<String, String> tokens = new HashMap<>();
        tokens.put("access-token", accessToken);
        tokens.put("refresh-token", refreshToken);

        Envoie les tokens frontend,Le frontend reçoit : { "access-token": "...","refresh-token": "..."}
        response.setContentType("application/json");
        new ObjectMapper().writeValue(response.getOutputStream(), tokens);*/
        String code = oauth2CodeService.generateCode(appUser.getUsername());
        String redirectUrl = oauth2RedirectUrl + "?code=" + code;
        response.sendRedirect(redirectUrl);
    }
    /*
     * retourne un username unique.
     * Essaie le nom de base, puis ajoute un suffixe court (_a1b2) jusqu'à trouver un nom libre.
     */

    private String resolveUniqueUsername(String base) {
        // Essayer le nom de base d'abord
        if (accountService.loadUserByUsername(base) == null) {
            return base;
        }
        // Sinon ajouter un suffixe aléatoire court — max 10 tentatives pour éviter toute boucle infinie
        String candidate;
        int maxAttempts = 10;
        int attempts = 0;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4); // ex: "a1b2"
            candidate = base + "_" + suffix;
            attempts++;
        } while (accountService.loadUserByUsername(candidate) != null && attempts < maxAttempts);
        if (attempts >= maxAttempts) {
            // Fallback : suffixe long garanti unique
            candidate = base + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        }
        return candidate;
    }
}