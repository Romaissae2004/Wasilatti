package com.backend.wasilatti.controller;

import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.OrderResponseDTO;
import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AccountService accountService;

    @GetMapping("/livreurs")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO.LivreurInfo>>> getLivreurs() {
        List<AppUser> users = accountService.listUsers();
        
        List<OrderResponseDTO.LivreurInfo> livreurs = users.stream()
                .filter(user -> user.getAppRoles().stream()
                        .anyMatch(role -> role.getRoleName().equals("LIVREUR")))
                .map(user -> new OrderResponseDTO.LivreurInfo(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getPhoneNumber(),
                        null,
                        null
                ))
                .toList();

        var response = new ApiResponse<>(true, "Liste des livreurs récupérée", livreurs);
        return ResponseEntity.ok(response);
    }
}
