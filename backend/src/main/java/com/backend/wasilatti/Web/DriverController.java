package com.backend.wasilatti.Web;

import com.backend.wasilatti.dto.response.ApiResponse;
import com.backend.wasilatti.dto.response.OrderResponseDTO;
import com.backend.wasilatti.repository.DriverRepository;
import com.backend.wasilatti.service.DistributionService;
import com.backend.wasilatti.service.DriverService;
import com.backend.wasilatti.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;
    private final DistributionService distributionService;
    private final DriverRepository driverRepository;
    private final OrderService orderService;

    public DriverController(
            DriverService driverService,
            DistributionService distributionService,
            DriverRepository driverRepository,
            OrderService orderService) {
        this.driverService = driverService;
        this.distributionService = distributionService;
        this.driverRepository = driverRepository;
        this.orderService = orderService;
    }

    // ── Profil du livreur connecté (LIVREUR ou ADMIN) ────────────────────────
    @PreAuthorize("hasAnyAuthority('LIVREUR', 'ADMIN')")
    @GetMapping("/me")
    public ResponseEntity<DriverDTO> getMyProfile(Principal principal) {
        return ResponseEntity.ok(driverService.getDriverByUsername(principal.getName()));
    }

    // ── Liste tous les livreurs (ADMIN uniquement) ───────────────────────────
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public List<DriverDTO> listDrivers() {
        return driverService.listDrivers();
    }

    // ── Commandes assignées au livreur connecté ──────────────────────────────
    @PreAuthorize("hasAuthority('LIVREUR')")
    @GetMapping("/me/orders")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getMyOrders(Principal principal) {
        List<OrderResponseDTO> orders = orderService.getOrdersForLivreur(principal.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Commandes du livreur récupérées", orders));
    }

    // ── GPS : mise à jour position via /me/location (appelé par le frontend) ─
    @PreAuthorize("hasAuthority('LIVREUR')")
    @PatchMapping("/me/location")
    public ResponseEntity<Void> updateMyLocation(
            @RequestBody Map<String, Double> body,
            Principal principal) {

        Double lat = body.get("latitude");
        Double lng = body.get("longitude");

        return driverRepository.findByAppUser_Username(principal.getName())
                .<ResponseEntity<Void>>map(driver -> {
                    driverService.recordHeartbeat(driver.getId(), lat, lng);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GPS : mise à jour position via /{id}/location (Admin/Simulation) ─────
    @PreAuthorize("hasAuthority('LIVREUR')")
    @PatchMapping("/{id}/location")
    public ResponseEntity<Void> updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body,
            Principal principal) {

        Double lat = body.get("latitude");
        Double lng = body.get("longitude");

        return driverRepository.findById(id)
                .filter(d -> d.getAppUser().getUsername().equals(principal.getName()))
                .<ResponseEntity<Void>>map(d -> {
                    driverService.recordHeartbeat(id, lat, lng);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ── Passer en ligne ───────────────────────────────────────────────────────
    @PreAuthorize("hasAuthority('LIVREUR')")
    @PostMapping("/me/online")
    public ResponseEntity<DriverDTO> markOnline(Principal principal) {
        return driverRepository.findByAppUser_Username(principal.getName())
                .map(driver -> {
                    DriverDTO dto = driverService.markOnline(driver.getId());
                    distributionService.onDriverAvailable(driver.getId());
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Passer hors ligne ─────────────────────────────────────────────────────
    @PreAuthorize("hasAuthority('LIVREUR')")
    @PostMapping("/me/offline")
    public ResponseEntity<Void> markOffline(Principal principal) {
        driverService.markOfflineByUsername(principal.getName());
        return ResponseEntity.ok().build();
    }

    // ── Statut propre du livreur ──────────────────────────────────────────────
    @PreAuthorize("hasAuthority('LIVREUR')")
    @PatchMapping("/me/status")
    public ResponseEntity<DriverDTO> updateOwnStatus(
            @RequestBody Map<String, String> body,
            Principal principal) {

        return driverRepository.findByAppUser_Username(principal.getName())
                .map(driver -> {
                    String newStatus = body.get("status");
                    DriverDTO dto = driverService.updateStatus(driver.getId(), newStatus);
                    if (dto.isOnline() && "DISPONIBLE".equalsIgnoreCase(dto.getStatus())) {
                        distributionService.onDriverAvailable(driver.getId());
                    }
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── CRUD Admin ────────────────────────────────────────────────────────────
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public DriverDTO createDriver(@Valid @RequestBody DriverRegistrationRequest req) {
        return driverService.createDriver(req);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<DriverDTO> updateDriver(
            @PathVariable Long id,
            @RequestBody DriverUpdateRequest req) {
        return ResponseEntity.ok(driverService.updateDriver(id, req));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteDriver(@PathVariable Long id) {
        driverService.deleteDriver(id);
    }

    @PreAuthorize("hasAnyAuthority('LIVREUR', 'ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<DriverDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("status");
        DriverDTO dto = driverService.updateStatus(id, newStatus);
        if (dto.isOnline() && "DISPONIBLE".equalsIgnoreCase(dto.getStatus())) {
            distributionService.onDriverAvailable(id);
        }
        return ResponseEntity.ok(dto);
    }

    // ── Utilitaires Admin ─────────────────────────────────────────────────────
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/backfill-locations")
    public ResponseEntity<Void> backfillLocations() {
        driverService.backfillDriverLocations();
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/migrate-existing")
    public List<DriverDTO> migrateExistingLivreurs() {
        List<DriverDTO> migrated = driverService.migrateExistingLivreurs();
        driverService.backfillDriverLocations();
        return migrated;
    }
}