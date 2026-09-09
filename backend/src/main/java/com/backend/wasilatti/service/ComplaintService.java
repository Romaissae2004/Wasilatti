package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.request.ComplaintReplyDTO;
import com.backend.wasilatti.dto.request.ComplaintRequestDTO;
import com.backend.wasilatti.dto.request.ComplaintStatusUpdateDTO;
import com.backend.wasilatti.dto.response.ComplaintResponseDTO;
import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.model.entity.Complaint;
import com.backend.wasilatti.model.entity.Order;
import com.backend.wasilatti.model.enums.ComplaintStatus;
import com.backend.wasilatti.repository.AppUserRepository;
import com.backend.wasilatti.repository.ComplaintRepository;
import com.backend.wasilatti.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final AppUserRepository userRepository;
    private final OrderRepository orderRepository;

    public ComplaintResponseDTO submitComplaint(String username, ComplaintRequestDTO request) {
        AppUser client = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + username));

        Complaint complaint = new Complaint();
        complaint.setClient(client);
        complaint.setType(request.getType());
        complaint.setSubject(request.getSubject().trim());
        complaint.setDescription(request.getDescription().trim());
        complaint.setSeverity(request.getSeverity());
        complaint.setStatus(ComplaintStatus.EN_ATTENTE);

        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + request.getOrderId()));

            if (!order.getClient().getId().equals(client.getId())) {
                throw new IllegalArgumentException("Cette commande ne vous appartient pas");
            }
            complaint.setOrder(order);
        }

        Complaint saved = complaintRepository.save(complaint);
        return mapToResponseDTO(saved);
    }

    public List<ComplaintResponseDTO> getComplaintsForClient(String username) {
        return complaintRepository.findByClient_UsernameOrderByCreatedAtDesc(username).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintRepository.findAll().stream()
                .sorted(Comparator.comparing(Complaint::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponseDTO)
                .toList();
    }

    public ComplaintResponseDTO getComplaintById(Long id) {
        Complaint complaint = findComplaintOrThrow(id);
        return mapToResponseDTO(complaint);
    }

    public ComplaintResponseDTO updateStatus(Long id, ComplaintStatusUpdateDTO request) {
        Complaint complaint = findComplaintOrThrow(id);
        ComplaintStatus newStatus = request.getStatus();

        complaint.setStatus(newStatus);

        if (newStatus == ComplaintStatus.RESOLU || newStatus == ComplaintStatus.REJETE) {
            complaint.setResolvedAt(Instant.now());
        } else {
            complaint.setResolvedAt(null);
        }

        return mapToResponseDTO(complaintRepository.save(complaint));
    }

    public ComplaintResponseDTO replyToComplaint(Long id, ComplaintReplyDTO request) {
        Complaint complaint = findComplaintOrThrow(id);
        complaint.setAdminResponse(request.getAdminResponse().trim());

        if (complaint.getStatus() == ComplaintStatus.EN_ATTENTE) {
            complaint.setStatus(ComplaintStatus.EN_COURS);
        }

        return mapToResponseDTO(complaintRepository.save(complaint));
    }

    private Complaint findComplaintOrThrow(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plainte introuvable avec l'ID: " + id));
    }

    private ComplaintResponseDTO mapToResponseDTO(Complaint complaint) {
        AppUser client = complaint.getClient();
        Order order = complaint.getOrder();
        AppUser livreur = order != null ? order.getLivreur() : null;

        return ComplaintResponseDTO.builder()
                .id(complaint.getId())
                .reference(String.format("REC-%03d", complaint.getId()))
                .clientId(client != null ? client.getId() : null)
                .clientName(client != null ? client.getUsername() : null)
                .clientEmail(client != null ? client.getEmail() : null)
                .orderId(order != null ? order.getId() : null)
                .driverId(livreur != null ? livreur.getId() : null)
                .driverName(livreur != null ? livreur.getUsername() : null)
                .type(complaint.getType())
                .subject(complaint.getSubject())
                .description(complaint.getDescription())
                .severity(complaint.getSeverity())
                .status(complaint.getStatus())
                .adminResponse(complaint.getAdminResponse())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .build();
    }
}
