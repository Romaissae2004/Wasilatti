package com.backend.wasilatti.service;

import com.backend.wasilatti.model.entity.Driver;
import com.backend.wasilatti.model.entity.Payment;
import com.backend.wasilatti.repository.DriverRepository;
import com.backend.wasilatti.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final DriverRepository driverRepository;

    public List<Payment> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        if (payments.isEmpty()) {
            seedMockPayments();
            payments = paymentRepository.findAll();
        }

        List<Driver> drivers = driverRepository.findAll();

        // 1. Delete payments for non-existing drivers (ghost drivers)
        for (Payment payment : new java.util.ArrayList<>(payments)) {
            boolean driverExists = drivers.stream()
                    .anyMatch(d -> d.getId().equals(payment.getDriverId()));
            if (!driverExists) {
                paymentRepository.delete(payment);
            }
        }

        // 2. Synchronize existing drivers' payments
        String currentPeriod = getCurrentPeriod();
        for (Driver driver : drivers) {
            List<Payment> driverPayments = paymentRepository.findByDriverId(driver.getId());
            if (driverPayments.isEmpty()) {
                Payment payment = new Payment();
                payment.setDriverId(driver.getId());
                payment.setDriverName(driver.getFirstName() + " " + driver.getLastName());
                payment.setPeriod(currentPeriod);
                payment.setDeliveries(driver.getTotalDeliveries());
                payment.setAmount(driver.getTotalRevenue());
                payment.setStatus("EN_ATTENTE");
                payment.setPhone(driver.getPhone());
                payment.setIban("MA6400012345678901234567");
                paymentRepository.save(payment);
            } else {
                for (Payment payment : driverPayments) {
                    payment.setDriverName(driver.getFirstName() + " " + driver.getLastName());
                    payment.setPhone(driver.getPhone());
                    if (payment.getPeriod().equals(currentPeriod) || driverPayments.size() == 1) {
                        payment.setDeliveries(driver.getTotalDeliveries());
                        payment.setAmount(driver.getTotalRevenue());
                    }
                    paymentRepository.save(payment);
                }
            }
        }

        return paymentRepository.findAll();
    }

    public Payment validatePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable avec l'ID: " + paymentId));
        payment.setStatus("VALIDE");
        return paymentRepository.save(payment);
    }

    public Payment rejectPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable avec l'ID: " + paymentId));
        payment.setStatus("REJETE");
        return paymentRepository.save(payment);
    }

    public void addDeliveryToPayment(Driver driver) {
        String period = getCurrentPeriod();
        List<Payment> payments = paymentRepository.findAll();
        Optional<Payment> existingPayment = payments.stream()
                .filter(p -> p.getDriverId().equals(driver.getId()) && p.getPeriod().equals(period) && "EN_ATTENTE".equals(p.getStatus()))
                .findFirst();

        Payment payment;
        if (existingPayment.isPresent()) {
            payment = existingPayment.get();
            payment.setDeliveries(payment.getDeliveries() + 1);
            payment.setAmount(payment.getAmount() + 10.0);
        } else {
            payment = new Payment();
            payment.setDriverId(driver.getId());
            payment.setDriverName(driver.getFirstName() + " " + driver.getLastName());
            payment.setPeriod(period);
            payment.setDeliveries(1);
            payment.setAmount(10.0);
            payment.setStatus("EN_ATTENTE");
            payment.setPhone(driver.getPhone());
            payment.setIban("MA6400012345678901234567");
        }
        paymentRepository.save(payment);
    }

    public String getCurrentPeriod() {
        LocalDate now = LocalDate.now();
        String[] months = {
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        };
        return months[now.getMonthValue() - 1] + " " + now.getYear();
    }

    private void seedMockPayments() {
        Payment p1 = new Payment();
        p1.setDriverId(1L);
        p1.setDriverName("Ahmed Tazi");
        p1.setPeriod("Mai 2026");
        p1.setDeliveries(45);
        p1.setAmount(450.0);
        p1.setStatus("VALIDE");
        p1.setPhone("+212611223344");
        p1.setIban("MA6400010001000100010001");
        paymentRepository.save(p1);

        Payment p2 = new Payment();
        p2.setDriverId(2L);
        p2.setDriverName("Yassine Mansouri");
        p2.setPeriod("Mai 2026");
        p2.setDeliveries(38);
        p2.setAmount(380.0);
        p2.setStatus("EN_ATTENTE");
        p2.setPhone("+212622334455");
        p2.setIban("MA6400020002000200020002");
        paymentRepository.save(p2);

        Payment p3 = new Payment();
        p3.setDriverId(3L);
        p3.setDriverName("Sara Alami");
        p3.setPeriod("Mai 2026");
        p3.setDeliveries(62);
        p3.setAmount(620.0);
        p3.setStatus("VALIDE");
        p3.setPhone("+212633445566");
        p3.setIban("MA6400030003000300030003");
        paymentRepository.save(p3);
    }
}
