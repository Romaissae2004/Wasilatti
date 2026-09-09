package com.backend.wasilatti.config;

import com.backend.wasilatti.service.DriverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class DistributionDataInitializer implements CommandLineRunner {

    private final DriverService driverService;

    @Override
    public void run(String... args) {
        driverService.backfillDriverLocations();
        driverService.markStaleDriversOffline();
        log.info("[Distribution] Positions GPS des livreurs initialisées, présence normalisée");
    }
}
