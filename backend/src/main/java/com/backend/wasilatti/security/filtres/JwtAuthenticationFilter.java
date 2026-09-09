package com.backend.wasilatti.security.filtres;

import com.backend.wasilatti.security.JWTUtil;
import com.backend.wasilatti.service.AccountService;
import com.backend.wasilatti.model.entity.AppUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/* ce filtre hérite de UsernamePasswordAuthenticationFilter */

public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final AuthenticationManager authenticationManager;
    private final JWTUtil jwtUtil;
    private final AccountService accountService;

    public JwtAuthenticationFilter(AuthenticationManager authenticationManager,JWTUtil jwtUtil, AccountService accountService){
        this.authenticationManager=authenticationManager;
        this.jwtUtil = jwtUtil;
        this.accountService = accountService;
        setFilterProcessesUrl("/auth/login");
    }
    /* je dois redéfinir les 2 méthods attemptAuthentication et successfulAuthentication */
    /*pour pouvoir compléter ce filtre là besoin d'utiliser un objet qui est fournit par spring sécurité appellé AuthenticationManager ce objet on peut le transmettre à ce filtre là via le constr  */
    /* qd l'user va tenter de s'authentifier */
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        try {
            Map<String, String> credentials = new ObjectMapper().readValue(request.getInputStream(), Map.class);
            String username = credentials.get("username");
            if (username == null) {
                username = credentials.get("email");
            }
            if (username == null) {
                username = credentials.get("usernameOrEmail");
            }
            String password = credentials.get("password");
            log.debug("Tentative d'authentification pour : {}", username);
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(username, password);
            return authenticationManager.authenticate(authenticationToken);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    /* qd l'authentification a réussit */
    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResult) throws IOException, ServletException {
        //System.out.println("successfulAuthentication");
        log.debug("Authentification réussie");
        /* qd on appelle la méthode successfulAuthentication il nous transmet un paramètre de type Authentication dont laquelle j'ai le résultat d'authentification */
        /*un objet User de spring , getPrincipal permet de retourner l'user authentifié besoin de faire un cast vers User car getPrincipal retourne un objet de type Object */
        User user=(User) authResult.getPrincipal(); /*maintenant j'ai obtenu l'user qui est authentifié cet user contient username et les roles */
        /*maintenant je dois générer le token JWT car maintenat j'utilise plus les sessions coté server donc j'ai besoi d'intégrer une library tapez en google auth0 jwt maven */
        /* pour calculer la signature de JWT soit utiliser l'algorithme HMAC demande une clé privée bach ysawb la signature ou RSA puis je vais générer le JWT*/
        AppUser appUser =
                accountService.loadUserByUsername(user.getUsername());
        if (appUser == null) {
            log.error("Utilisateur introuvable en base de données lors de la génération du token : {}", user.getUsername());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            new ObjectMapper().writeValue(response.getOutputStream(), Map.of("error", "Utilisateur introuvable après authentification"));
            return;
        }

        String jwtAccessToken =
                jwtUtil.generateAccessToken(
                        appUser,
                        request.getRequestURL().toString());

        String jwtRefreshToken =
                jwtUtil.generateRefreshToken(
                        user.getUsername(),
                        request.getRequestURL().toString());

        /*je vais avoir un idToken qui contient 2  jwts */
        Map<String,String> idToken=new HashMap<>();
        idToken.put("access-token",jwtAccessToken);
        idToken.put("refresh-token",jwtRefreshToken);
        response.setContentType("application/json"); /* envoyer cette réponse en format de json en corps de la réponse , indiquer au client le contenu de corps de la réponse contient des données de json */
        new ObjectMapper().writeValue(response.getOutputStream(),idToken);/* utilisé par spring pour sérialiser un objet en format de json , écrire une valeur en sortie , je vais envoyer la response http je veux envoyer le idToken ds le corps de la réponse en format json*/

        /*Envoyer ce token JWT au client en Header je vais l'appeller Authorization et sa val est jwtAccessToken ou en body
        response.setHeader("Authorization",jwtAccessToken); */
        /*super.successfulAuthentication(request, response, chain, authResult);*/
    }
    //Avec cette méthode, Mon API REST renverra un JSON propre ({"error": "..."}) au lieu d’une page HTML d’erreur Spring par défaut
    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
                                              HttpServletResponse response,
                                              AuthenticationException failed) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        new ObjectMapper().writeValue(response.getOutputStream(),
                Map.of("error", "Nom d'utilisateur ou mot de passe incorrect"));
    }

}
