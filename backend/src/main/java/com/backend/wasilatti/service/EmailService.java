package com.backend.wasilatti.service;

import com.backend.wasilatti.model.entity.Order;
import com.backend.wasilatti.model.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOrderConfirmationEmail(Order order) {
        if (order.getClient() == null || order.getClient().getEmail() == null) {
            return; // Pas d'email client disponible
        }

        String to = order.getClient().getEmail();
        String subject = "Wasilatti - Confirmation de votre commande n°" + order.getId();

        StringBuilder text = new StringBuilder();
        text.append("Bonjour ").append(order.getClient().getUsername()).append(",\n\n");
        text.append("Merci pour votre commande sur Wasilatti !\n\n");
        text.append("Voici le récapitulatif de votre commande n°").append(order.getId()).append(" :\n\n");

        for (OrderItem item : order.getItems()) {
            text.append("- ")
                .append(item.getQuantity())
                .append("x ")
                .append(item.getProduct().getName())
                .append(" (")
                .append(String.format("%.2f", item.getPrice()))
                .append(" DH l'unité)\n");
        }

        text.append("\nMontant total : ").append(String.format("%.2f", order.getTotalPrice())).append(" DH\n\n");
        
        text.append("Nous vous informerons dès que votre commande sera en cours de livraison.\n\n");
        text.append("À bientôt sur Wasilatti !");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text.toString());

        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Log l'erreur mais on ne bloque pas la création de la commande
            System.err.println("Erreur lors de l'envoi de l'email de confirmation : " + e.getMessage());
        }
    }

    public void sendOrderInDeliveryEmail(Order order) {
        if (order.getClient() == null || order.getClient().getEmail() == null) {
            return;
        }

        String to = order.getClient().getEmail();
        String subject = "Wasilatti - Votre commande n°" + order.getId() + " est en cours de livraison !";

        StringBuilder text = new StringBuilder();
        text.append("Bonjour ").append(order.getClient().getUsername()).append(",\n\n");
        text.append("Bonne nouvelle ! Votre commande n°").append(order.getId()).append(" est actuellement en cours de livraison.\n\n");
        
        if (order.getLivreur() != null) {
            text.append("Votre livreur est ").append(order.getLivreur().getUsername()).append(".\n");
        }
        
        text.append("Vous pouvez suivre la position de votre livreur en temps réel directement depuis l'application Wasilatti.\n\n");
        text.append("Préparez-vous à recevoir votre commande !\n\n");
        text.append("À très bientôt,\nL'équipe Wasilatti");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text.toString());

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email de livraison : " + e.getMessage());
        }
    }
    public void sendNotificationEmail(Order order, String subject, String messageText) {
        if (order.getClient() == null || order.getClient().getEmail() == null) {
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getClient().getEmail());
        message.setSubject(subject);
        message.setText(messageText);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email de notification : " + e.getMessage());
        }
    }
}
