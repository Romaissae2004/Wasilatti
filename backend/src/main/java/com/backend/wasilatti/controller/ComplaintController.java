package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.request.ComplaintReplyDTO;
import com.backend.wasilatti.dto.request.ComplaintRequestDTO;
import com.backend.wasilatti.dto.request.ComplaintStatusUpdateDTO;
import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.ComplaintResponseDTO;
import com.backend.wasilatti.service.ComplaintService;
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
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping("/api/complaints")
    @PreAuthorize("hasAnyAuthority('USER', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<ComplaintResponseDTO>>> getMyComplaints(Principal principal) {
        List<ComplaintResponseDTO> complaints = complaintService.getComplaintsForClient(principal.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Vos plaintes récupérées", complaints));
    }

    @PostMapping("/api/complaints")
    @PreAuthorize("hasAnyAuthority('USER', 'CLIENT')")
    public ResponseEntity<ApiResponse<ComplaintResponseDTO>> submitComplaint(
            Principal principal,
            @Valid @RequestBody ComplaintRequestDTO request) {
        ComplaintResponseDTO complaint = complaintService.submitComplaint(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Plainte enregistrée avec succès", complaint));
    }

    @GetMapping("/api/admin/complaints")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<ComplaintResponseDTO>>> getAllComplaints() {
        List<ComplaintResponseDTO> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(new ApiResponse<>(true, "Toutes les plaintes récupérées", complaints));
    }

    @GetMapping("/api/admin/complaints/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponseDTO>> getComplaintById(@PathVariable Long id) {
        ComplaintResponseDTO complaint = complaintService.getComplaintById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Détails de la plainte récupérés", complaint));
    }

    @PatchMapping("/api/admin/complaints/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponseDTO>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintStatusUpdateDTO request) {
        ComplaintResponseDTO complaint = complaintService.updateStatus(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Statut de la plainte mis à jour", complaint));
    }

    @PostMapping("/api/admin/complaints/{id}/reply")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponseDTO>> replyToComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintReplyDTO request) {
        ComplaintResponseDTO complaint = complaintService.replyToComplaint(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Réponse envoyée au client", complaint));
    }
}
