package com.backend.wasilatti.service;

import com.backend.wasilatti.Web.DriverDTO;
import com.backend.wasilatti.Web.DriverRegistrationRequest;
import com.backend.wasilatti.Web.DriverUpdateRequest;
import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.model.entity.*;
import com.backend.wasilatti.model.enums.DriverStatus;
import com.backend.wasilatti.model.enums.Vehicle;
import com.backend.wasilatti.repository.AppUserRepository;
import com.backend.wasilatti.repository.DriverRepository;
import com.backend.wasilatti.repository.OrderRepository;
import com.backend.wasilatti.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class DriverService {

    public static final int ONLINE_THRESHOLD_MINUTES = 3;

    private final DriverRepository driverRepository;
    private final AccountService accountService;
    private final AppUserRepository appUserRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final GeoLocationService geoLocationService;

    public List<DriverDTO> migrateExistingLivreurs() {
        appUserRepository.findAll().stream()
                .filter(u -> u.getAppRoles().stream()
                        .anyMatch(r -> r.getRoleName().equals("LIVREUR")))
                .filter(u -> driverRepository.findByAppUser(u).isEmpty())
                .forEach(user -> {
                    Driver driver = new Driver();
                    driver.setAppUser(user);
                    driver.setFirstName(user.getUsername());
                    driver.setLastName("");
                    driver.setCin("--");
                    driver.setPhone("--");
                    driver.setAdresse("--");
                    driver.setVehicle(Vehicle.MOTO);
                    driver.setZone("Rabat Centre");
                    driver.setStatus(DriverStatus.HORS_LIGNE);
                    driver.setRating(5.0);
                    driver.setTotalDeliveries(0);
                    driver.setTotalRevenue(0.0);
                    geoLocationService.enrichDriverLocation(driver);
                    driverRepository.save(driver);
                });
        return listDrivers();
    }

    public DriverDTO createDriver(DriverRegistrationRequest req) {
        AppUser appUser = new AppUser();
        appUser.setUsername(req.getUsername());
        appUser.setEmail(req.getEmail());
        appUser.setPassword(req.getPassword());

        AppRole livreurRole = new AppRole();
        livreurRole.setRoleName("LIVREUR");
        appUser.setAppRoles(List.of(livreurRole));

        AppUser savedUser = accountService.registerUser(appUser, true);

        Driver driver = new Driver();
        driver.setAppUser(savedUser);
        driver.setFirstName(req.getFirstName());
        driver.setLastName(req.getLastName());
        driver.setCin(req.getCin());
        driver.setPhone(req.getPhone());
        driver.setAdresse(req.getAdresse());
        driver.setVehicle(req.getVehicle() != null ? Vehicle.valueOf(req.getVehicle().toUpperCase()) : Vehicle.MOTO);
        driver.setZone(req.getZone() != null ? req.getZone() : "Rabat Centre");
        driver.setStatus(DriverStatus.HORS_LIGNE);
        geoLocationService.enrichDriverLocation(driver);

        return toDTO(driverRepository.save(driver));
    }

    public void backfillDriverLocations() {
        driverRepository.findAll().forEach(driver -> {
            if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null) {
                geoLocationService.enrichDriverLocation(driver);
                driverRepository.save(driver);
            }
        });
    }

    public List<DriverDTO> listDrivers() {
        return driverRepository.findAll().stream().map(this::toDTO).toList();
    }

    public DriverDTO getDriverByUsername(String username) {
        return driverRepository.findByAppUser_Username(username)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Profil livreur introuvable pour : " + username));
    }

    public boolean isOnline(Driver driver) {
        return driver.getLastSeenAt() != null
                && driver.getLastSeenAt().isAfter(LocalDateTime.now().minusMinutes(ONLINE_THRESHOLD_MINUTES));
    }

    public DriverDTO markOnline(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + driverId));
        if (driver.getStatus() == DriverStatus.SUSPENDU) {
            throw new IllegalStateException("Ce livreur est suspendu");
        }
        driver.setLastSeenAt(LocalDateTime.now());
        applyPresenceStatus(driver);
        return toDTO(driverRepository.save(driver));
    }

    public void markOffline(Long driverId) {
        driverRepository.findById(driverId).ifPresent(driver -> {
            if (driver.getStatus() != DriverStatus.SUSPENDU) {
                driver.setStatus(DriverStatus.HORS_LIGNE);
                driverRepository.save(driver);
            }
        });
    }

    public void markOfflineByUsername(String username) {
        driverRepository.findByAppUser_Username(username).ifPresent(driver -> markOffline(driver.getId()));
    }

    public void recordHeartbeat(Long driverId, Double latitude, Double longitude) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + driverId));
        if (driver.getStatus() == DriverStatus.SUSPENDU) {
            return;
        }
        driver.setLastSeenAt(LocalDateTime.now());
        if (latitude != null && longitude != null) {
            driver.setCurrentLatitude(latitude);
            driver.setCurrentLongitude(longitude);
        } else {
            geoLocationService.enrichDriverLocation(driver);
        }
        applyPresenceStatus(driver);
        driverRepository.save(driver);
    }

    public void markStaleDriversOffline() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(ONLINE_THRESHOLD_MINUTES);
        driverRepository.findAll().forEach(driver -> {
            if (driver.getStatus() == DriverStatus.SUSPENDU || driver.getStatus() == DriverStatus.HORS_LIGNE) {
                return;
            }
            if (driver.getLastSeenAt() == null || driver.getLastSeenAt().isBefore(cutoff)) {
                driver.setStatus(DriverStatus.HORS_LIGNE);
                driverRepository.save(driver);
                log.info("[Présence] Livreur #{} → HORS_LIGNE (inactif)", driver.getId());
            }
        });
    }

    public void refreshPresenceStatus(Driver driver) {
        if (driver.getStatus() == DriverStatus.SUSPENDU) {
            return;
        }
        applyPresenceStatus(driver);
    }

    private void applyPresenceStatus(Driver driver) {
        if (!isOnline(driver)) {
            driver.setStatus(DriverStatus.HORS_LIGNE);
            return;
        }
        driver.setStatus(driver.getCurrentOrdersCount() > 0 ? DriverStatus.EN_LIVRAISON : DriverStatus.DISPONIBLE);
    }

    public DriverDTO updateDriver(Long id, DriverUpdateRequest req) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + id));

        if (req.getFirstName() != null) driver.setFirstName(req.getFirstName());
        if (req.getLastName() != null)  driver.setLastName(req.getLastName());
        if (req.getCin() != null)       driver.setCin(req.getCin());
        if (req.getPhone() != null)     driver.setPhone(req.getPhone());
        if (req.getAdresse() != null)   driver.setAdresse(req.getAdresse());
        if (req.getVehicle() != null)   driver.setVehicle(Vehicle.valueOf(req.getVehicle().toUpperCase()));
        if (req.getZone() != null)      driver.setZone(req.getZone());

        geoLocationService.enrichDriverLocation(driver);

        if (req.getEmail() != null) {
            driver.getAppUser().setEmail(req.getEmail());
            appUserRepository.save(driver.getAppUser());
        }

        return toDTO(driverRepository.save(driver));
    }

    public DriverDTO updateStatus(Long id, String status) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + id));

        DriverStatus requested = parseDriverStatus(status);
        switch (requested) {
            case SUSPENDU -> driver.setStatus(DriverStatus.SUSPENDU);
            case HORS_LIGNE -> driver.setStatus(DriverStatus.HORS_LIGNE);
            case DISPONIBLE, EN_LIVRAISON -> {
                if (!isOnline(driver)) {
                    throw new IllegalStateException(
                            "Le livreur doit être connecté à l'app pour être disponible ou en livraison");
                }
                applyPresenceStatus(driver);
            }
        }

        geoLocationService.enrichDriverLocation(driver);
        return toDTO(driverRepository.save(driver));
    }

    private DriverStatus parseDriverStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Statut livreur requis");
        }
        String normalized = status.trim().toUpperCase()
                .replace(' ', '_')
                .replace("É", "E");
        return DriverStatus.valueOf(normalized);
    }

    public void deleteDriver(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + id));
        AppUser user = driver.getAppUser();

        // 1. Dissociate from orders
        if (user != null) {
            List<Order> orders = orderRepository.findByLivreur_Id(user.getId());
            for (Order o : orders) {
                o.setLivreur(null);
                orderRepository.save(o);
            }
            
            // 2. Delete Cart if exists
            cartRepository.findByUser_Username(user.getUsername()).ifPresent(cartRepository::delete);
        }

        // 3. Delete Driver entity
        driverRepository.delete(driver);

        // 4. Delete AppUser entity
        if (user != null) {
            appUserRepository.delete(user);
        }
    }

    private DriverStatus resolveEffectiveStatus(Driver driver) {
        if (driver.getStatus() == DriverStatus.SUSPENDU) {
            return DriverStatus.SUSPENDU;
        }
        if (!isOnline(driver)) {
            return DriverStatus.HORS_LIGNE;
        }
        return driver.getCurrentOrdersCount() > 0 ? DriverStatus.EN_LIVRAISON : DriverStatus.DISPONIBLE;
    }

    private DriverDTO toDTO(Driver d) {
        DriverDTO dto = new DriverDTO();
        dto.setId(d.getId());
        dto.setAppUserId(d.getAppUser().getId());
        dto.setUsername(d.getAppUser().getUsername());
        dto.setEmail(d.getAppUser().getEmail());
        dto.setFirstName(d.getFirstName());
        dto.setLastName(d.getLastName());
        dto.setName(d.getFirstName() + " " + d.getLastName());
        dto.setCin(d.getCin());
        dto.setPhone(d.getPhone());
        dto.setAdresse(d.getAdresse());
        dto.setVehicle(d.getVehicle().name());
        dto.setZone(d.getZone());
        dto.setStatus(resolveEffectiveStatus(d).name());
        dto.setRating(d.getRating());
        dto.setDeliveries(d.getTotalDeliveries());
        dto.setRevenue(d.getTotalRevenue());
        dto.setPhoto(d.getPhotoUrl());
        dto.setCurrentLatitude(d.getCurrentLatitude());
        dto.setCurrentLongitude(d.getCurrentLongitude());
        dto.setCurrentOrdersCount(d.getCurrentOrdersCount());
        dto.setMaxCapacity(d.getMaxCapacity());
        dto.setLastSeenAt(d.getLastSeenAt());
        dto.setOnline(isOnline(d));
        return dto;
    }
}