package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.request.EvaluationRequestDTO;
import com.backend.wasilatti.dto.response.EvaluationResponseDTO;
import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.model.entity.*;
import com.backend.wasilatti.model.enums.OrderStatus;
import com.backend.wasilatti.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final AppUserRepository userRepository;

    public EvaluationResponseDTO createEvaluation(String clientUsername, EvaluationRequestDTO request) {
        AppUser client = userRepository.findByUsername(clientUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + clientUsername));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + request.getOrderId()));

        // Validations
        if (!order.getClient().getId().equals(client.getId())) {
            throw new IllegalArgumentException("Cette commande ne vous appartient pas");
        }

        if (order.getStatus() != OrderStatus.LIVRÉE) {
            throw new IllegalArgumentException("Vous ne pouvez évaluer qu'une commande livrée");
        }

        if (order.getLivreur() == null) {
            throw new IllegalArgumentException("Cette commande n'a pas de livreur associé");
        }

        Optional<Evaluation> existing = evaluationRepository.findByOrder_Id(order.getId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Cette commande a déjà été évaluée");
        }

        Driver driver = driverRepository.findByAppUser(order.getLivreur())
                .orElseThrow(() -> new ResourceNotFoundException("Profil livreur introuvable pour ce livreur"));

        Evaluation evaluation = new Evaluation();
        evaluation.setOrder(order);
        evaluation.setClient(client);
        evaluation.setDriver(driver);
        evaluation.setRating(request.getRating());
        evaluation.setComment(request.getComment() != null ? request.getComment().trim() : null);

        Evaluation saved = evaluationRepository.save(evaluation);

        // Recalculer la note moyenne du livreur
        recalculateDriverRating(driver);

        return mapToResponseDTO(saved);
    }

    public EvaluationResponseDTO getEvaluationByOrderId(Long orderId, String username) {
        Evaluation eval = evaluationRepository.findByOrder_Id(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Évaluation introuvable pour la commande : " + orderId));

        // Vérifier si l'utilisateur a le droit d'accéder (le client ou l'admin)
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        boolean isAdmin = user.getAppRoles().stream().anyMatch(r -> r.getRoleName().equals("ADMIN"));
        if (!eval.getClient().getId().equals(user.getId()) && !isAdmin) {
            throw new IllegalArgumentException("Accès non autorisé à cette évaluation");
        }

        return mapToResponseDTO(eval);
    }

    public List<EvaluationResponseDTO> getDriverEvaluations(String driverUsername) {
        return evaluationRepository.findByDriver_AppUser_UsernameOrderByCreatedAtDesc(driverUsername).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    public List<EvaluationResponseDTO> getAllEvaluations() {
        return evaluationRepository.findAll().stream()
                .sorted(Comparator.comparing(Evaluation::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponseDTO)
                .toList();
    }

    public List<EvaluationResponseDTO> getPublicEvaluations() {
        return evaluationRepository.findAll().stream()
                .filter(e -> e.getComment() != null && !e.getComment().trim().isEmpty() && e.getRating() >= 4)
                .sorted(Comparator.comparing(Evaluation::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .map(this::mapToResponseDTO)
                .toList();
    }

    public void deleteEvaluation(Long id) {
        Evaluation eval = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Évaluation introuvable : " + id));

        Driver driver = eval.getDriver();
        evaluationRepository.delete(eval);

        // Recalculer la note moyenne du livreur
        recalculateDriverRating(driver);
    }

    private void recalculateDriverRating(Driver driver) {
        Double avg = evaluationRepository.getAverageRatingByDriver(driver);
        if (avg == null) {
            driver.setRating(5.0);
        } else {
            // Arrondir à 1 décimale
            double rounded = Math.round(avg * 10.0) / 10.0;
            driver.setRating(rounded);
        }
        driverRepository.save(driver);
        log.info("Note recalculée pour le livreur {} : {}", driver.getFirstName() + " " + driver.getLastName(), driver.getRating());
    }

    private EvaluationResponseDTO mapToResponseDTO(Evaluation e) {
        return EvaluationResponseDTO.builder()
                .id(e.getId())
                .orderId(e.getOrder().getId())
                .clientId(e.getClient().getId())
                .clientUsername(e.getClient().getUsername())
                .driverId(e.getDriver().getId())
                .driverUsername(e.getDriver().getAppUser().getUsername())
                .driverName(e.getDriver().getFirstName() + " " + e.getDriver().getLastName())
                .rating(e.getRating())
                .comment(e.getComment())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
