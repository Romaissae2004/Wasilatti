package com.backend.wasilatti.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class WhatsAppService {

    public void sendWhatsAppMessage(String phoneNumber, String message) {
        log.info("Sending WhatsApp message to {}: {}", phoneNumber, message);
        System.out.println("==========================================================================");
        System.out.println("                   [SIMULATION D'ENVOI WHATSAPP]");
        System.out.println("Destinataire : " + (phoneNumber != null ? phoneNumber : "Non spécifié"));
        System.out.println("Message      : " + message);
        System.out.println("==========================================================================");
    }
}
