package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.model.entity.Payment;
import com.backend.wasilatti.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(new ApiResponse<>(true, "Paiements récupérés", payments));
    }

    @PatchMapping("/{id}/validate")
    public ResponseEntity<ApiResponse<Payment>> validatePaymentPatch(@PathVariable Long id) {
        Payment payment = paymentService.validatePayment(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Paiement validé avec succès", payment));
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse<Payment>> validatePaymentPost(@PathVariable Long id) {
        Payment payment = paymentService.validatePayment(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Paiement validé avec succès", payment));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Payment>> rejectPaymentPatch(@PathVariable Long id) {
        Payment payment = paymentService.rejectPayment(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Paiement rejeté avec succès", payment));
    }
}
