package com.backend.wasilatti.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Gère les exceptions d'unicité / doublons (ex: nom d'utilisateur ou email déjà pris).
     * Renvoie un statut HTTP 409 Conflict.
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateResource(DuplicateResourceException ex) {
        log.warn("Ressource dupliquée : {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("erreur", ex.getMessage()));
    }

    /**
     * Gère les exceptions de ressource introuvable (404 Not Found).
     * S'applique à ResourceNotFoundException et à ses sous-classes.
     */
    @ExceptionHandler({
            ResourceNotFoundException.class,
            CategoryNotFoundException.class,
            CollaboratorNotFoundException.class,
            ProductNotFoundException.class,
            ImageUrlNotFoundException.class
    })
    public ResponseEntity<Map<String, String>> handleResourceNotFound(RuntimeException ex) {
        log.warn("Ressource non trouvée : {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erreur", ex.getMessage()));
    }

    /**
     * Gère les tokens invalides ou expirés (401 Unauthorized).
     */
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidToken(InvalidTokenException ex) {
        log.warn("Token invalide ou expiré : {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", ex.getMessage()));
    }

    /**
     * Gère les erreurs de logique métier / requêtes invalides (400 Bad Request).
     */
    @ExceptionHandler({
            InvalidPriceException.class,
            InsufficientQuantityException.class,
            ImageNotBelongsToProductException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<Map<String, String>> handleBadRequestExceptions(RuntimeException ex) {
        log.warn("Requête invalide : {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erreur", ex.getMessage()));
    }

    /**
     * Gère les erreurs de validation des paramètres d'entrée (@Valid).
     * Renvoie un statut HTTP 400 Bad Request contenant le détail des champs invalides.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            details.put(fieldName, errorMessage);
        });

        log.warn("Erreurs de validation de requête : {}", details);

        Map<String, Object> response = new HashMap<>();
        response.put("erreur", "Données de requête invalides");
        response.put("details", details);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Gestionnaire fallback pour toutes les autres exceptions non gérées (500 Internal Server Error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllUncaughtExceptions(Exception ex) {
        log.error("Erreur serveur non gérée", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erreur", "Une erreur interne du serveur est survenue."));
    }
}
