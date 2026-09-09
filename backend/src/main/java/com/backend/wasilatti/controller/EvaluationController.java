package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.EvaluationRequestDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.EvaluationResponseDTO;
import com.backend.wasilatti.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationService evaluationService;

    // ── Soumettre une évaluation (Rôle client : USER) ──────────────────────────
    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<ApiResponse<EvaluationResponseDTO>> submitEvaluation(
            Principal principal,
            @Valid @RequestBody EvaluationRequestDTO request) {
        EvaluationResponseDTO dto = evaluationService.createEvaluation(principal.getName(), request);
        var response = new ApiResponse<>(true, "Évaluation enregistrée avec succès", dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── Obtenir l'évaluation d'une commande (USER ou ADMIN) ───────────────────
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<EvaluationResponseDTO>> getEvaluationByOrder(
            Principal principal,
            @PathVariable Long orderId) {
        EvaluationResponseDTO dto = evaluationService.getEvaluationByOrderId(orderId, principal.getName());
        var response = new ApiResponse<>(true, "Évaluation récupérée", dto);
        return ResponseEntity.ok(response);
    }

    // ── Obtenir les évaluations d'un livreur spécifique (LIVREUR ou ADMIN) ──
    @GetMapping("/driver/{username}")
    @PreAuthorize("hasAnyAuthority('LIVREUR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EvaluationResponseDTO>>> getDriverEvaluations(
            @PathVariable String username) {
        List<EvaluationResponseDTO> list = evaluationService.getDriverEvaluations(username);
        var response = new ApiResponse<>(true, "Évaluations du livreur récupérées", list);
        return ResponseEntity.ok(response);
    }

    // ── Obtenir ses propres évaluations (Rôle livreur : LIVREUR) ───────────────
    @GetMapping("/driver-me")
    @PreAuthorize("hasAuthority('LIVREUR')")
    public ResponseEntity<ApiResponse<List<EvaluationResponseDTO>>> getMyDriverEvaluations(
            Principal principal) {
        List<EvaluationResponseDTO> list = evaluationService.getDriverEvaluations(principal.getName());
        var response = new ApiResponse<>(true, "Vos évaluations en tant que livreur", list);
        return ResponseEntity.ok(response);
    }

    // ── Obtenir toutes les évaluations (Rôle admin : ADMIN) ───────────────────
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<EvaluationResponseDTO>>> getAllEvaluations() {
        List<EvaluationResponseDTO> list = evaluationService.getAllEvaluations();
        var response = new ApiResponse<>(true, "Toutes les évaluations récupérées", list);
        return ResponseEntity.ok(response);
    }

    // ── Obtenir les évaluations publiques pour la landing page (Tout le monde) ─
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<EvaluationResponseDTO>>> getPublicEvaluations() {
        List<EvaluationResponseDTO> list = evaluationService.getPublicEvaluations();
        var response = new ApiResponse<>(true, "Évaluations publiques récupérées", list);
        return ResponseEntity.ok(response);
    }

    // ── Supprimer/Modérer une évaluation (Rôle admin : ADMIN) ─────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(@PathVariable Long id) {
        evaluationService.deleteEvaluation(id);
        var response = new ApiResponse<Void>(true, "Évaluation supprimée avec succès");
        return ResponseEntity.ok(response);
    }
}
