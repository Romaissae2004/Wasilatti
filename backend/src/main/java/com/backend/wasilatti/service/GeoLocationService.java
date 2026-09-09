package com.backend.wasilatti.service;

import com.backend.wasilatti.model.entity.Driver;
import com.backend.wasilatti.model.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class GeoLocationService {

    private static final Map<String, double[]> MOROCCO_ZONES = new LinkedHashMap<>();

    static {
        MOROCCO_ZONES.put("rabat", new double[]{34.0209, -6.8416});
        MOROCCO_ZONES.put("agdal", new double[]{33.9747, -6.8497});
        MOROCCO_ZONES.put("hay riad", new double[]{33.9596, -6.8704});
        MOROCCO_ZONES.put("souissi", new double[]{33.9590, -6.8520});
        MOROCCO_ZONES.put("casablanca", new double[]{33.5731, -7.5898});
        MOROCCO_ZONES.put("maarif", new double[]{33.5890, -7.6370});
        MOROCCO_ZONES.put("anfa", new double[]{33.5950, -7.6700});
        MOROCCO_ZONES.put("marrakech", new double[]{31.6295, -7.9811});
        MOROCCO_ZONES.put("gueliz", new double[]{31.6340, -8.0089});
        MOROCCO_ZONES.put("medina", new double[]{31.6290, -7.9810});
        MOROCCO_ZONES.put("fes", new double[]{34.0181, -5.0078});
        MOROCCO_ZONES.put("tanger", new double[]{35.7595, -5.8340});
        MOROCCO_ZONES.put("agadir", new double[]{30.4278, -9.5981});
    }

    @Value("${wasilatti.default-pickup-latitude:34.0209}")
    private double defaultPickupLat;

    @Value("${wasilatti.default-pickup-longitude:-6.8416}")
    private double defaultPickupLon;

    public double[] defaultPickupCoords() {
        return new double[]{defaultPickupLat, defaultPickupLon};
    }

    public Optional<double[]> resolveFromText(String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, double[]> entry : MOROCCO_ZONES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return Optional.of(entry.getValue());
            }
        }
        return Optional.empty();
    }

    public void enrichDriverLocation(Driver driver) {
        if (driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null) {
            return;
        }

        Optional<double[]> coords = resolveFromText(driver.getZone());
        if (coords.isEmpty()) {
            coords = resolveFromText(driver.getAdresse());
        }
        if (coords.isEmpty()) {
            coords = Optional.of(defaultPickupCoords());
        }

        double[] point = coords.get();
        driver.setCurrentLatitude(point[0]);
        driver.setCurrentLongitude(point[1]);
        log.info("[Geo] Livreur #{} position initiale → {}, {}", driver.getId(), point[0], point[1]);
    }

    public void enrichOrderGeo(Order order) {
        if (order.getLatitude() == null || order.getLongitude() == null) {
            resolveFromText(order.getDeliveryAddress()).ifPresent(coords -> {
                order.setLatitude(coords[0]);
                order.setLongitude(coords[1]);
                log.info("[Geo] Commande #{} coords client déduites de l'adresse", order.getId());
            });
        }

        if (order.getMerchantLatitude() == null || order.getMerchantLongitude() == null) {
            Optional<double[]> pickup = resolveFromText(order.getDeliveryAddress());
            if (pickup.isPresent()) {
                double[] coords = pickup.get();
                order.setMerchantLatitude(coords[0]);
                order.setMerchantLongitude(coords[1]);
                log.info("[Geo] Commande #{} point de retrait déduit de l'adresse", order.getId());
            } else {
                double[] pickupDefault = defaultPickupCoords();
                order.setMerchantLatitude(pickupDefault[0]);
                order.setMerchantLongitude(pickupDefault[1]);
                log.debug("[Geo] Commande #{} point de retrait par défaut → {}, {}", order.getId(), pickupDefault[0], pickupDefault[1]);
            }
        }
    }

    public boolean hasClientCoords(Order order) {
        return order.getLatitude() != null && order.getLongitude() != null;
    }

    public boolean hasPickupCoords(Order order) {
        return order.getMerchantLatitude() != null && order.getMerchantLongitude() != null;
    }
}
