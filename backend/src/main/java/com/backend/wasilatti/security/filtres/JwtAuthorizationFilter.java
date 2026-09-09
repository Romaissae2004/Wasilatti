package com.backend.wasilatti.security.filtres;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.backend.wasilatti.security.JWTUtil;
import com.backend.wasilatti.service.TokenBlacklistService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Component
public class JwtAuthorizationFilter extends OncePerRequestFilter {
    /* OncePerRequestFilter contient une seule méthode à redéfinir  ,ce code s’exécute une fois pour chaque requête*/

    private final TokenBlacklistService tokenBlacklistService; //j'utilises mon service pour vérifier si un token est révoqué (blacklisté)
    private final JWTUtil jwtUtil;

    public JwtAuthorizationFilter(TokenBlacklistService tokenBlacklistService,JWTUtil jwtUtil) {
        this.tokenBlacklistService = tokenBlacklistService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        return path.startsWith("/refreshToken") ||
               path.startsWith("/login") ||
               path.startsWith("/register") ||
               path.startsWith("/logout") ||
               path.startsWith("/forgot-password") ||
               path.startsWith("/reset-password") ||
               path.startsWith("/oauth2") ||
               path.startsWith("/auth") ||
               path.startsWith("/h2-console");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        /* doFilterInternal une méthode qui s'éxecute à chaque fois qu'il y a une requete , avant qu'il atteint dispatcerservlet je fais un travail */
        /* utiliser l'objet request pour lire le header Authorization , je suppose que ds la requete y'a un header qui contient ce jwt puis je teste */

        String authorizationToken = request.getHeader(JWTUtil.AUTH_HEADER); //Récupérer le token je lis le header HTTP : Authorization: Bearer xxxxx
        //je vérifie le format je vérifies que le token commence par "Bearer "
        if (authorizationToken != null && authorizationToken.startsWith(JWTUtil.PREFIX)) /* = null c-à-d token je l'ai pas recu alors rejeter && si il existe il doit etre préfixer par Bearer , Bearer dire que il y a un token qui contient tt les infos de la session */ {
            /*à chaque fois qu'il y une requete qui arrive la requete doit representer le json*/
            try /*si y'a pas de problème faire ca */ {
                /* je vais prendre ce jwt et éliminer ce préfixe from ce jwt */
                String jwt = authorizationToken.substring(JWTUtil.PREFIX.length()); /*7:j'ignore les 7 premiers caractères de la chaine et j'obtiens que le jwt */
                /*je dois signer ce jwt vérifier est ce que il est valable ce jwt */

                //vérifier si token est blacklisté
                if (tokenBlacklistService.isBlacklisted(jwt)) {
                    sendJsonError(response, HttpServletResponse.SC_UNAUTHORIZED,
                            "Token révoqué, veuillez vous reconnecter");
                    return;
                }

                Algorithm algorithm = Algorithm.HMAC256(jwtUtil.getSecret());/* le meme secret que j'ai utilisé pour signer le token ds configsecurity pour vérifier le token*/
                JWTVerifier jwtVerifier = JWT.require(algorithm).build(); /*j'ai créer ce verifier:signature*/
                DecodedJWT decodedJWT = jwtVerifier.verify(jwt);/*maintenant je vais utiliser ce verifier pour vérifier ce token est ce qu'il est valide et qd il vérifie il retourne une var de type decodedJWT*/
                /*decodedJWT contient tt le contenu à partir de decodedJWT je peux récupérer la session de l'user : username , roles tt ce que je voulais  */
                String username = decodedJWT.getSubject(); /*Subject contient le username*/
                String[] roles = decodedJWT.getClaim("roles").asArray(String.class);/*je récupère les roles c'est un tableau de String */
                Collection<GrantedAuthority> authorities = new ArrayList<>();
                /*convertir un liste de role en grantedauthority, pour chaque role r dans la liste des roles je vais ajouter ds authorities */
                for (String r : roles) {
                    authorities.add(new SimpleGrantedAuthority(r));
                }
                /*maintenant je veux authentifier l'utilisateur et pour l'authentifier je vais créer un objet de type UsernamePasswordAuthenticationToken de string.Je dis à Spring :cet user est connecté*/
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(username, null, authorities);/*pw null j'en ai pas besoin de pw car jwt ne contient pas mdp*/
                /*je sais pas si l'objet authentifié est cela ou pas maintenant je vais authentifié ce user,je laisses passer la requête */
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);/*qd une requete arrive je luis dis tiens voila sa session authenticationToken*/
                filterChain.doFilter(request, response);/*tu passes au suivant avec une authentification je te connais ,j'intercepte la requete je finis la vérification tu passes au filtre suivant orienter la requete à dispatcherservlet */

            } catch (Exception e)/*si nn par exemple est expiré générer une tel exception si prob au niveau de signature il génére une autre exception */ {
                sendJsonError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Token invalide ou expiré");
            }
        } else {
            filterChain.doFilter(request, response);/*tu passes mais je te connais pas,springsecurityfilter va vérifier est ce que la ressource demandé nécessite une authentification ou non */
        }
    }
        /**
         * Envoie une réponse d'erreur JSON propre au lieu d'exposer
         * les détails techniques dans les headers HTTP.
         */
        private void sendJsonError(HttpServletResponse response, int status, String message)
            throws IOException {
            response.setStatus(status);
            response.setContentType("application/json");
            new ObjectMapper().writeValue(response.getOutputStream(), Map.of("erreur", message));
    }
}
/*ligne 88:response.setHeader("error-message",e.getMessage());
                    response.sendError(HttpServletResponse.SC_FORBIDDEN); */ //ou mettre 404 c'est la meme que j'ai écris là
/* message d'erreur envoyé dans le corps JSON,
 * pas dans un header HTTP (les headers sont loggés par les proxies
 * et peuvent exposer des détails techniques sensibles). */
/*ligne60:response.setHeader("error-message", "Token révoqué, veuillez vous reconnecter");
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED);//accès refusé
                        return;
                        */