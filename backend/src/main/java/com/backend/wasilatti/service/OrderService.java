package com.backend.wasilatti.service;

import com.backend.wasilatti.dto.request.OrderRequestDTO;
import com.backend.wasilatti.dto.response.OrderResponseDTO;
import com.backend.wasilatti.dto.response.ProductResponseDTO;
import com.backend.wasilatti.exception.InsufficientQuantityException;
import com.backend.wasilatti.exception.ProductNotFoundException;
import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.model.entity.*;
import com.backend.wasilatti.model.enums.OrderStatus;
import com.backend.wasilatti.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartService cartService;
    private final AppUserRepository userRepository;
    private final ProductRepository productRepository;
    private final DriverRepository driverRepository;
    private final DistributionService distributionService;
    private final GeoLocationService geoLocationService;
    private final PaymentService paymentService;
    private final EmailService emailService;

    public OrderResponseDTO createOrder(String username, OrderRequestDTO request) {
        Cart cart = cartService.getOrCreateCart(username);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Votre panier est vide");
        }

        // Validation adresse OU GPS
        boolean hasAddress = request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank();
        boolean hasGPS = request.getLatitude() != null && request.getLongitude() != null;

        if (!hasAddress && !hasGPS) {
            throw new IllegalArgumentException("Veuillez fournir une adresse de livraison ou votre position GPS");
        }

        AppUser client = cart.getUser();

        Order order = new Order();
        order.setClient(client);
        order.setStatus(OrderStatus.EN_ATTENTE);
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setLatitude(request.getLatitude());
        order.setLongitude(request.getLongitude());
        
        // Numéro de téléphone de contact (soit spécifié dans l'ordre, soit celui du profil utilisateur s'il existe)
        String contactPhone = request.getContactPhone();
        if (contactPhone == null || contactPhone.isBlank()) {
            contactPhone = client.getPhoneNumber();
        }
        order.setContactPhone(contactPhone);

        double totalPrice = 0.0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // Vérifier les stocks
            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new InsufficientQuantityException(product.getName());
            }

            // Déduire les stocks
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());

            // Appliquer le prix promotionnel si en promotion
            double itemPrice = product.getPrice();
            if (product.isInPromotion()) {
                itemPrice = itemPrice * (1.0 - (product.getPromotionPercentage() / 100.0));
            }
            orderItem.setPrice(itemPrice);

            orderItems.add(orderItem);
            totalPrice += itemPrice * cartItem.getQuantity();
        }

        order.setTotalPrice(totalPrice);
        order.setItems(orderItems);
        geoLocationService.enrichOrderGeo(order);

        if (!geoLocationService.hasClientCoords(order)) {
            throw new IllegalArgumentException(
                    "Impossible de déterminer la position de livraison. Fournissez le GPS ou une adresse contenant une ville reconnue (ex: Rabat, Casablanca).");
        }

        Order savedOrder = orderRepository.save(order);

        // Vider le panier
        cartService.clearCart(cart);

        // Envoyer l'email de confirmation
        emailService.sendOrderConfirmationEmail(savedOrder);

        return mapToOrderResponseDTO(savedOrder);
    }

    public List<OrderResponseDTO> getOrdersForClient(String username) {
        return orderRepository.findByClient_Username(username).stream()
                .map(this::mapToOrderResponseDTO)
                .toList();
    }

    public OrderResponseDTO getOrderById(Long orderId, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));

        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + username));

        boolean isAdmin = user.getAppRoles().stream().anyMatch(role -> role.getRoleName().equals("ADMIN"));
        boolean isClient = order.getClient().getUsername().equals(username);
        boolean isLivreur = order.getLivreur() != null && order.getLivreur().getUsername().equals(username);

        if (!isAdmin && !isClient && !isLivreur) {
            throw new SecurityException("Vous n'êtes pas autorisé à accéder à cette commande");
        }

        return mapToOrderResponseDTO(order);
    }

    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToOrderResponseDTO)
                .toList();
    }

    public List<OrderResponseDTO> getOrdersForMerchant(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + username));
        if (user.getCollaborator() == null) {
            return List.of();
        }
        Long collaboratorId = user.getCollaborator().getId();
        List<Order> orders = orderRepository.findByCollaboratorId(collaboratorId);

        return orders.stream()
                .map(order -> {
                    OrderResponseDTO dto = mapToOrderResponseDTO(order);
                    // Filter items to only include products belonging to this collaborator
                    List<OrderResponseDTO.OrderItemInfo> filteredItems = dto.getItems().stream()
                            .filter(item -> item.getProduct() != null &&
                                            item.getProduct().getCollaborator() != null &&
                                            item.getProduct().getCollaborator().getId().equals(collaboratorId))
                            .toList();
                    dto.setItems(filteredItems);

                    // Recalculate total price for this merchant's items
                    double merchantTotal = filteredItems.stream()
                            .mapToDouble(item -> item.getPrice() * item.getQuantity())
                            .sum();
                    dto.setTotalPrice(merchantTotal);

                    return dto;
                })
                .toList();
    }

    public OrderResponseDTO confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));

        if (order.getStatus() != OrderStatus.EN_ATTENTE) {
            throw new IllegalStateException("Seules les commandes EN_ATTENTE peuvent être confirmées");
        }

        order.setStatus(OrderStatus.CONFIRMÉE);
        geoLocationService.enrichOrderGeo(order);
        Order savedOrder = orderRepository.save(order);
        distributionService.assignOrder(savedOrder);
        // Envoi Email
        String clientName = order.getClient().getUsername();
        String message = String.format("Bonjour %s, votre commande n°%d d'un montant de %.2f DH sur Wasilatti a été CONFIRMÉE ! Elle est en cours de préparation.",
                clientName, order.getId(), order.getTotalPrice());

        emailService.sendNotificationEmail(order, "Wasilatti - Commande confirmée", message);

        return mapToOrderResponseDTO(savedOrder);
    }

    public OrderResponseDTO cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));

        if (order.getStatus() == OrderStatus.LIVRÉE || order.getStatus() == OrderStatus.ANNULÉE) {
            throw new IllegalStateException("Impossible d'annuler une commande déjà livrée ou annulée");
        }

        // Remettre en stock les produits si la commande n'a pas déjà été annulée
        if (order.getStatus() != OrderStatus.ANNULÉE) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setQuantity(product.getQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(OrderStatus.ANNULÉE);
        distributionService.onOrderCompleted(order, false);
        order.setLivreur(null);
        Order savedOrder = orderRepository.save(order);
        // Optionnel: Envoyer notification d'annulation par Email
        String clientName = order.getClient().getUsername();
        String message = String.format("Bonjour %s, votre commande n°%d a été ANNULÉE.", clientName, order.getId());
        emailService.sendNotificationEmail(order, "Wasilatti - Commande annulée", message);

        return mapToOrderResponseDTO(savedOrder);
    }

    public void deleteOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));
        distributionService.onOrderCompleted(order, false);
        orderRepository.delete(order);
    }

    public OrderResponseDTO assignLivreur(Long orderId, Long livreurId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));

        if (order.getStatus() != OrderStatus.CONFIRMÉE && order.getStatus() != OrderStatus.EN_ATTENTE && order.getStatus() != OrderStatus.EN_LIVRAISON) {
            throw new IllegalStateException("Le livreur peut être assigné uniquement si la commande est EN_ATTENTE, CONFIRMÉE ou EN_LIVRAISON");
        }

        Driver driver = driverRepository.findById(livreurId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable avec l'ID: " + livreurId));

        if (driver.getStatus() == com.backend.wasilatti.model.enums.DriverStatus.SUSPENDU) {
            throw new IllegalStateException("Ce livreur est actuellement suspendu et ne peut pas être affecté à une commande");
        }

        AppUser livreur = driver.getAppUser();
        if (livreur == null) {
            throw new ResourceNotFoundException("Utilisateur associé au livreur introuvable");
        }

        // Vérifier que l'utilisateur a bien le rôle LIVREUR
        boolean isLivreur = livreur.getAppRoles().stream()
                .anyMatch(role -> role.getRoleName().equals("LIVREUR"));

        if (!isLivreur) {
            throw new IllegalArgumentException("L'utilisateur spécifié n'a pas le rôle LIVREUR");
        }

        distributionService.assignManually(order, driver);
        Order savedOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));
        AppUser assignedLivreur = savedOrder.getLivreur();

        String clientName = savedOrder.getClient().getUsername();
        String message = String.format("Bonjour %s, votre commande n°%d est EN COURS DE LIVRAISON par %s (Tél: %s).",
                clientName, savedOrder.getId(), assignedLivreur.getUsername(),
                assignedLivreur.getPhoneNumber() != null ? assignedLivreur.getPhoneNumber() : "Non spécifié");
        emailService.sendNotificationEmail(savedOrder, "Wasilatti - Commande en cours de livraison", message);

        return mapToOrderResponseDTO(savedOrder);
    }

    public List<OrderResponseDTO> getOrdersForLivreur(String username) {
        return orderRepository.findByLivreur_Username(username).stream()
                .map(this::mapToOrderResponseDTO)
                .toList();
    }

    public OrderResponseDTO markOrderAsDelivered(Long orderId, String livreurUsername) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));

        if (order.getLivreur() == null || !order.getLivreur().getUsername().equals(livreurUsername)) {
            throw new SecurityException("Vous n'êtes pas le livreur assigné à cette commande");
        }

        if (order.getStatus() != OrderStatus.EN_LIVRAISON) {
            throw new IllegalStateException("La commande doit être EN_LIVRAISON pour être marquée comme LIVRÉE");
        }

        order.setStatus(OrderStatus.LIVRÉE);
        
        // Mettre à jour les stats du livreur
        Driver driver = driverRepository.findByAppUser(order.getLivreur()).orElse(null);
        if (driver != null) {
            driver.setTotalDeliveries(driver.getTotalDeliveries() + 1);
            driver.setTotalRevenue(driver.getTotalRevenue() + 10.0);
            driver.setStatus(com.backend.wasilatti.model.enums.DriverStatus.DISPONIBLE);
            driverRepository.save(driver);
            paymentService.addDeliveryToPayment(driver);
        }

        Order savedOrder = orderRepository.save(order);
        distributionService.onOrderCompleted(savedOrder, true);
        // Envoyer notification Email au client
        String clientName = order.getClient().getUsername();
        String message = String.format("Bonjour %s, votre commande n°%d a été LIVRÉE avec succès ! Merci de votre confiance.",
                clientName, order.getId());
        emailService.sendNotificationEmail(order, "Wasilatti - Commande livrée", message);

        return mapToOrderResponseDTO(savedOrder);
    }

    public OrderResponseDTO updateOrderStatusForLivreur(Long orderId, OrderStatus status, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'ID: " + orderId));

        if (order.getLivreur() == null || !order.getLivreur().getUsername().equals(username)) {
            throw new SecurityException("Vous n'êtes pas le livreur assigné à cette commande");
        }

        // Le livreur ne peut que marquer LIVRÉE ou RETOURNÉE
        if (status != OrderStatus.LIVRÉE && status != OrderStatus.RETOURNÉE) {
            throw new IllegalArgumentException("Le livreur ne peut mettre à jour qu'en LIVRÉE ou RETOURNÉE");
        }

        // La commande doit être EN_LIVRAISON et driverAccepted=true pour être marquée comme LIVRÉE
        if (status == OrderStatus.LIVRÉE && (order.getStatus() != OrderStatus.EN_LIVRAISON || !order.isDriverAccepted())) {
            throw new IllegalStateException("La commande doit être en cours de livraison (récupérée) pour être livrée");
        }

        // Rétablir les stocks si RETOURNÉE (éviter le double rétablissement)
        if (status == OrderStatus.RETOURNÉE && order.getStatus() != OrderStatus.RETOURNÉE) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setQuantity(product.getQuantity() + item.getQuantity());
                    
                    // Fix potential validation issues silently
                    if (!product.isInPromotion()) {
                        product.setPromotionPercentage(0);
                    } else if (product.getPromotionPercentage() <= 0) {
                        product.setInPromotion(false);
                    }
                    
                    productRepository.save(product);
                }
            }
        }

        // Mettre à jour les stats du livreur
        if (status == OrderStatus.LIVRÉE) {
            Driver driver = driverRepository.findByAppUser(order.getLivreur()).orElse(null);
            if (driver != null) {
                driver.setTotalDeliveries((driver.getTotalDeliveries() != null ? driver.getTotalDeliveries() : 0) + 1);
                driver.setTotalRevenue((driver.getTotalRevenue() != null ? driver.getTotalRevenue() : 0.0) + 10.0);
                driver.setStatus(com.backend.wasilatti.model.enums.DriverStatus.DISPONIBLE);
                driverRepository.save(driver);
                paymentService.addDeliveryToPayment(driver);
            }
        } else if (status == OrderStatus.RETOURNÉE) {
            Driver driver = driverRepository.findByAppUser(order.getLivreur()).orElse(null);
            if (driver != null) {
                driver.setStatus(com.backend.wasilatti.model.enums.DriverStatus.DISPONIBLE);
                driverRepository.save(driver);
            }
        }

        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        distributionService.onOrderCompleted(savedOrder, status == OrderStatus.LIVRÉE);

        // Envoi Email uniquement pour la livraison
        if (status == OrderStatus.LIVRÉE) {
            String clientName = order.getClient().getUsername();
            String message = String.format("Bonjour %s, votre commande n°%d a été LIVRÉE avec succès ! Merci de votre confiance.", clientName, order.getId());
            emailService.sendNotificationEmail(order, "Wasilatti - Commande livrée", message);
        }

        return mapToOrderResponseDTO(savedOrder);
    }


    private OrderResponseDTO mapToOrderResponseDTO(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setClientUsername(order.getClient().getUsername());
        dto.setClientEmail(order.getClient().getEmail());
        dto.setStatus(order.getStatus());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setLatitude(order.getLatitude());
        dto.setLongitude(order.getLongitude());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setContactPhone(order.getContactPhone());
        dto.setMerchantLatitude(order.getMerchantLatitude());
        dto.setMerchantLongitude(order.getMerchantLongitude());
        dto.setDriverAccepted(order.isDriverAccepted());
        dto.setAssignedAt(order.getAssignedAt());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        List<OrderResponseDTO.OrderItemInfo> itemInfos = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            OrderResponseDTO.OrderItemInfo itemInfo = new OrderResponseDTO.OrderItemInfo();
            itemInfo.setId(item.getId());
            itemInfo.setPrice(item.getPrice());
            itemInfo.setQuantity(item.getQuantity());
            itemInfo.setProduct(CartService.mapProductToResponseDTO(item.getProduct()));
            itemInfos.add(itemInfo);
        }
        dto.setItems(itemInfos);

        if (order.getLivreur() != null) {
            OrderResponseDTO.LivreurInfo livreurInfo = new OrderResponseDTO.LivreurInfo();
            livreurInfo.setId(order.getLivreur().getId());
            livreurInfo.setUsername(order.getLivreur().getUsername());
            livreurInfo.setEmail(order.getLivreur().getEmail());
            livreurInfo.setPhoneNumber(order.getLivreur().getPhoneNumber());

            driverRepository.findByAppUser(order.getLivreur()).ifPresent(driver -> {
                livreurInfo.setCurrentLatitude(driver.getCurrentLatitude());
                livreurInfo.setCurrentLongitude(driver.getCurrentLongitude());
            });

            dto.setLivreur(livreurInfo);
        }

        return dto;
    }
}