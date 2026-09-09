package com.backend.wasilatti.service;

import com.backend.wasilatti.algorithm.HaversineCalculator;
import com.backend.wasilatti.model.entity.Driver;
import com.backend.wasilatti.model.entity.Order;
import com.backend.wasilatti.model.enums.DriverStatus;
import com.backend.wasilatti.model.enums.OrderStatus;
import com.backend.wasilatti.repository.DriverRepository;
import com.backend.wasilatti.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DistributionService {

    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeoLocationService geoLocationService;
    private final DriverService driverService;
    private final EmailService emailService;

    private static final int TIMEOUT_MINUTES = 2;

    // ── Assignation principale ────────────────────────────────────────────────

    @Transactional
    public Optional<String> assignOrder(Order order) {
        if (order.getStatus() != OrderStatus.CONFIRMÉE)
            return Optional.of("La commande doit être CONFIRMÉE pour être assignée");

        geoLocationService.enrichOrderGeo(order);
        orderRepository.save(order);

        double[] reference = resolveAssignmentReference(order);
        if (reference == null) {
            log.warn("[Distribution] Commande #{} sans coordonnées GPS (adresse: {})", order.getId(), order.getDeliveryAddress());
            return Optional.of("Commande sans coordonnées GPS — ajoutez une adresse avec ville (Rabat, Casablanca…) ou des coordonnées");
        }

        List<Driver> candidates = findCandidates(order);

        if (candidates.isEmpty()) {
            String reason = diagnoseFailure(order);
            log.info("[Distribution] Commande #{} → file d'attente ({})", order.getId(), reason);
            return Optional.of(reason);
        }

        final double refLat = reference[0], refLon = reference[1];

        // Utiliser le calcul temps total livreur→dépôt→client si des dépôts sont définis
        boolean hasDepots = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null
                        && item.getProduct().getDepotLatitude() != null);

        Optional<Driver> best = hasDepots
                ? selectFastestDriver(candidates, order)
                : selectNearestDriver(candidates, refLat, refLon);

        if (best.isEmpty()) {
            return Optional.of("Aucun livreur éligible après scoring");
        }

        Driver chosen = best.get();
        log.info("[Distribution] Commande #{} → Livreur #{} ({}, {} km du point de livraison)",
                order.getId(), chosen.getId(), chosen.getAppUser().getUsername(),
                Math.round(driverDistanceKm(chosen, refLat, refLon) * 100.0) / 100.0);
        doAssign(order, chosen);
        return Optional.empty();
    }

    private double[] resolveAssignmentReference(Order order) {
        if (order.getLatitude() != null && order.getLongitude() != null) {
            return new double[]{order.getLatitude(), order.getLongitude()};
        }
        if (order.getMerchantLatitude() != null && order.getMerchantLongitude() != null) {
            return new double[]{order.getMerchantLatitude(), order.getMerchantLongitude()};
        }
        return null;
    }

    private Optional<Driver> selectNearestDriver(List<Driver> candidates, double refLat, double refLon) {
        return candidates.stream()
                .min(Comparator
                        .comparingDouble((Driver d) -> driverDistanceKm(d, refLat, refLon))
                        .thenComparingInt(Driver::getCurrentOrdersCount)
                        .thenComparingDouble(d -> -d.getPerformanceScore()));
    }

    private Optional<Driver> selectFastestDriver(List<Driver> candidates, Order order) {
        double clientLat = order.getLatitude() != null ? order.getLatitude() : 0;
        double clientLon = order.getLongitude() != null ? order.getLongitude() : 0;

        // Collecter tous les dépôts des produits de la commande
        List<double[]> depots = order.getItems().stream()
                .filter(item -> item.getProduct() != null
                        && item.getProduct().getDepotLatitude() != null
                        && item.getProduct().getDepotLongitude() != null)
                .map(item -> new double[]{
                        item.getProduct().getDepotLatitude(),
                        item.getProduct().getDepotLongitude()})
                .distinct()
                .toList();

        return candidates.stream()
                .min(Comparator
                        .comparingDouble((Driver d) -> totalTimeMinutes(d, depots, clientLat, clientLon))
                        .thenComparingInt(Driver::getCurrentOrdersCount)
                        .thenComparingDouble(d -> -d.getPerformanceScore()));
    }

    /**
     * Calcule le temps total en minutes : livreur → dépôt(s) → client.
     * Si aucun dépôt n'est défini, utilise la distance directe livreur → client.
     */
    private double totalTimeMinutes(Driver driver, List<double[]> depots, double clientLat, double clientLon) {
        if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null)
            return Double.MAX_VALUE;

        double dLat = driver.getCurrentLatitude();
        double dLon = driver.getCurrentLongitude();
        double speedKmh = speedForVehicle(driver);

        if (depots.isEmpty()) {
            // Pas de dépôt défini : distance directe livreur → client
            double dist = HaversineCalculator.distanceKm(dLat, dLon, clientLat, clientLon);
            return (dist / speedKmh) * 60.0;
        }

        // Trouver le dépôt le plus proche du livreur, puis aller au client
        double bestTime = Double.MAX_VALUE;
        for (double[] depot : depots) {
            double toDepot  = HaversineCalculator.distanceKm(dLat, dLon, depot[0], depot[1]);
            double toClient = HaversineCalculator.distanceKm(depot[0], depot[1], clientLat, clientLon);
            double time = ((toDepot + toClient) / speedKmh) * 60.0;
            if (time < bestTime) bestTime = time;
        }
        return bestTime;
    }

    private double speedForVehicle(Driver driver) {
        if (driver.getVehicle() == null) return 30.0;
        return switch (driver.getVehicle()) {
            case MOTO    -> 35.0;
            case VOITURE -> 30.0;
            case VELO    -> 15.0;
        };
    }

    private double driverDistanceKm(Driver driver, double refLat, double refLon) {
        if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null) {
            return Double.MAX_VALUE;
        }
        return HaversineCalculator.distanceKm(
                driver.getCurrentLatitude(), driver.getCurrentLongitude(), refLat, refLon);
    }

    @Transactional
    protected void doAssign(Order order, Driver driver) {
        log.info("[Distribution] Commande #{} → Livreur #{}", order.getId(), driver.getId());

        order.setLivreur(driver.getAppUser());
        // Le statut reste CONFIRMÉE tant que le livreur n'a pas récupéré le colis.
        // Il passera à EN_LIVRAISON lors de l'acceptation (onDriverAccepted).
        order.setStatus(OrderStatus.CONFIRMÉE);
        order.setAssignedAt(LocalDateTime.now());
        order.setDriverAccepted(false);
        orderRepository.save(order);

        driver.setCurrentOrdersCount(driver.getCurrentOrdersCount() + 1);
        driverService.refreshPresenceStatus(driver);
        driverRepository.save(driver);

        notifyDriver(driver, order);
    }

    // ── Scheduler : retry file d'attente toutes les 60s ──────────────────────

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void retryUnassignedOrders() {
        List<Order> pending = orderRepository.findUnassignedConfirmedOrders();
        if (!pending.isEmpty()) {
            log.info("[Scheduler] {} commande(s) en attente", pending.size());
            pending.forEach(this::assignOrder);
        }
    }

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void markStaleDriversOffline() {
        driverService.markStaleDriversOffline();
    }

    // ── Scheduler : timeout livreur toutes les 30s ───────────────────────────

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void handleTimeout() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES);
        List<Order> timedOut = orderRepository.findTimedOutAssignments(cutoff);

        for (Order order : timedOut) {
            log.info("[Timeout] Commande #{} → réassignation", order.getId());
            releaseDriver(order);
            order.setLivreur(null);
            order.setStatus(OrderStatus.CONFIRMÉE);
            order.setAssignedAt(null);
            order.setDriverAccepted(false);
            orderRepository.save(order);
            assignOrder(order);
        }
    }

    // ── Événement : livreur redevient disponible ──────────────────────────────

    @Transactional
    public void onDriverAvailable(Long driverId) {
        List<Order> pending = orderRepository.findUnassignedConfirmedOrders();
        if (!pending.isEmpty()) {
            log.info("[Distribution] Livreur #{} disponible → {} commande(s) en attente", driverId, pending.size());
            pending.forEach(this::assignOrder);
        }
    }

    @Transactional
    public void assignManually(Order order, Driver driver) {
        if (!driverService.isOnline(driver)) {
            throw new IllegalStateException("Ce livreur n'est pas connecté à l'app");
        }
        if (driver.getCurrentOrdersCount() >= driver.getMaxCapacity()) {
            throw new IllegalStateException("Ce livreur a atteint sa capacité maximale");
        }
        releaseDriver(order); // Release the previous driver, if any
        geoLocationService.enrichDriverLocation(driver);
        driverRepository.save(driver);
        doAssign(order, driver);
        onDriverAccepted(order.getId());
    }

    // ── Événement : commande terminée ─────────────────────────────────────────

    @Transactional
    public void onOrderCompleted(Order order, boolean success) {
        if (order.getLivreur() == null)
            return;

        driverRepository.findByAppUser(order.getLivreur()).ifPresent(driver -> {
            driver.setCurrentOrdersCount(Math.max(0, driver.getCurrentOrdersCount() - 1));
            if (success) {
                driver.setTotalDeliveries((driver.getTotalDeliveries() != null ? driver.getTotalDeliveries() : 0) + 1);
                Double orderPrice = order.getTotalPrice() != null ? order.getTotalPrice() : 0.0;
                driver.setTotalRevenue((driver.getTotalRevenue() != null ? driver.getTotalRevenue() : 0.0) + orderPrice);
            }
            driver.setPerformanceScore(Math.min(1.0, (driver.getRating() != null ? driver.getRating() : 5.0) / 5.0));
            driverService.refreshPresenceStatus(driver);
            driverRepository.save(driver);
        });
    }

    // ── Acceptation / récupération du colis par le livreur ───────────────────
    // Appelé quand le livreur clique "Récupérer le colis".
    // Passe le statut à EN_LIVRAISON → visible pour le client.
    @Transactional
    public void onDriverAccepted(Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setDriverAccepted(true);
            order.setStatus(OrderStatus.EN_LIVRAISON);
            orderRepository.save(order);
            if (order.getLivreur() != null) {
                driverRepository.findByAppUser(order.getLivreur()).ifPresent(driver -> {
                    driver.setStatus(DriverStatus.EN_LIVRAISON);
                    driverRepository.save(driver);
                });
            }
            emailService.sendOrderInDeliveryEmail(order);
        });
    }

    // ── Calculs internes ──────────────────────────────────────────────────────

    private List<Driver> findCandidates(Order order) {
        LocalDateTime onlineSince = LocalDateTime.now().minusMinutes(DriverService.ONLINE_THRESHOLD_MINUTES);
        return driverRepository.findAssignableDrivers(onlineSince).stream()
                .peek(driver -> {
                    if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null) {
                        geoLocationService.enrichDriverLocation(driver);
                        driverRepository.save(driver);
                    }
                })
                .filter(d -> d.getCurrentLatitude() != null && d.getCurrentLongitude() != null)
                .filter(d -> driverService.isOnline(d))
                .filter(d -> matchesZone(d, order))
                .toList();
    }

    private String diagnoseFailure(Order order) {
        List<Driver> all = driverRepository.findAll();
        if (all.isEmpty()) {
            return "Aucun profil livreur en base — exécutez POST /api/drivers/migrate-existing";
        }

        long online = all.stream().filter(driverService::isOnline).count();
        long active = all.stream()
                .filter(d -> d.getStatus() == DriverStatus.DISPONIBLE || d.getStatus() == DriverStatus.EN_LIVRAISON)
                .count();
        long withGps = all.stream()
                .filter(d -> d.getCurrentLatitude() != null && d.getCurrentLongitude() != null)
                .count();
        long withCapacity = all.stream()
                .filter(d -> d.getCurrentOrdersCount() < d.getMaxCapacity())
                .count();
        long zoneOk = all.stream().filter(d -> matchesZone(d, order)).count();

        return String.format(
                "Aucun livreur éligible (en ligne=%d, actifs=%d, avec GPS=%d, capacité libre=%d, zone compatible=%d). "
                        + "Vérifiez : livreur connecté à l'app, statut DISPONIBLE ou EN_LIVRAISON, position GPS, zone/adresse compatibles.",
                online, active, withGps, withCapacity, zoneOk);
    }

    private boolean matchesZone(Driver driver, Order order) {
        if (driver.getZone() == null || driver.getZone().isBlank())
            return true;
        if (order.getDeliveryAddress() == null || order.getDeliveryAddress().isBlank())
            return true;
        String zone = driver.getZone().toLowerCase().trim();
        String address = order.getDeliveryAddress().toLowerCase();
        if (address.contains(zone) || zone.contains(address.split(",")[0].trim()))
            return true;
        String zoneCity = zone.split("\\s+")[0];
        if (address.contains(zoneCity))
            return true;
        if (order.getLatitude() != null && order.getLongitude() != null
                && driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null) {
            double distKm = HaversineCalculator.distanceKm(
                    driver.getCurrentLatitude(), driver.getCurrentLongitude(),
                    order.getLatitude(), order.getLongitude());
            return distKm <= 25.0;
        }
        return false;
    }

    private void releaseDriver(Order order) {
        if (order.getLivreur() == null)
            return;
        driverRepository.findByAppUser(order.getLivreur()).ifPresent(driver -> {
            driver.setCurrentOrdersCount(Math.max(0, driver.getCurrentOrdersCount() - 1));
            driverService.refreshPresenceStatus(driver);
            driverRepository.save(driver);
        });
    }

    private void notifyDriver(Driver driver, Order order) {
        String username = driver.getAppUser().getUsername();
        OrderNotificationDTO payload = new OrderNotificationDTO(
                order.getId(), order.getDeliveryAddress(), order.getTotalPrice(),
                order.getMerchantLatitude(), order.getMerchantLongitude(),
                order.getLatitude(), order.getLongitude());
        messagingTemplate.convertAndSendToUser(username, "/queue/new-order", payload);
        log.info("[WebSocket] Notif envoyée → livreur '{}' commande #{}", username, order.getId());
    }

    public record OrderNotificationDTO(
            Long orderId, String deliveryAddress, Double totalPrice,
            Double merchantLat, Double merchantLon, Double clientLat, Double clientLon) {
    }
}