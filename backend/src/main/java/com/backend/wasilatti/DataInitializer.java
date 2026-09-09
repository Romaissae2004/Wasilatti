package com.backend.wasilatti;

import com.backend.wasilatti.model.entity.*;
import com.backend.wasilatti.model.enums.DriverStatus;
import com.backend.wasilatti.model.enums.Vehicle;
import com.backend.wasilatti.repository.*;
import com.backend.wasilatti.service.GeoLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final AppUserRepository userRepository;
        private final AppRoleRepository roleRepository;
        private final ProductRepository productRepository;
        private final CategoryRepository categoryRepository;
        private final CollaboratorRepository collaboratorRepository;
        private final ImageRepository imageRepository;
        private final PasswordEncoder passwordEncoder;
        private final DriverRepository driverRepository;
        private final GeoLocationService geoLocationService;
        private final OrderRepository orderRepository;
        private final EvaluationRepository evaluationRepository;

        // Dépôts d'Oujda
        private static final String[] OUJDA_DEPOT_ADDRESSES = {
                "Dépôt Oujda Centre, Rue Marrakech",
                "Dépôt Oujda Lazaret, Bd Al Maghrib Al Arabi",
                "Dépôt Oujda Université, Hay Al Qods",
                "Dépôt Oujda Sidi Yahya, Route Sidi Yahya"
        };
        private static final double[] OUJDA_DEPOT_LATS = { 34.6814, 34.6627, 34.6500, 34.6542 };
        private static final double[] OUJDA_DEPOT_LNGS = { -1.9086, -1.8961, -1.8900, -1.8845 };
        private final java.util.Random random = new java.util.Random();

        @Override
        public void run(String... args) {

                // 1. Créer les rôles s'ils n'existent pas
                AppRole adminRole = roleRepository.findByRoleName("ADMIN")
                                .orElseGet(() -> roleRepository.save(new AppRole(null, "ADMIN")));

                AppRole userRole = roleRepository.findByRoleName("USER")
                                .orElseGet(() -> roleRepository.save(new AppRole(null, "USER")));

                AppRole livreurRole = roleRepository.findByRoleName("LIVREUR")
                                .orElseGet(() -> roleRepository.save(new AppRole(null, "LIVREUR")));

                // 2. Créer le compte admin s'il n'existe pas
                if (userRepository.findByUsername("admin").isEmpty()) {
                        AppUser admin = new AppUser();
                        admin.setUsername("admin");
                        admin.setEmail("admin@wasilatti.com");
                        admin.setPassword(passwordEncoder.encode("Admin@1234"));
                        admin.setPhoneNumber("+212699999999");
                        admin.getAppRoles().add(adminRole);
                        userRepository.save(admin);
                        System.out.println("Compte admin créé : admin / Admin@1234");
                }

                // 3. Créer le compte client s'il n'existe pas
                if (userRepository.findByUsername("client").isEmpty()) {
                        AppUser client = new AppUser();
                        client.setUsername("client");
                        client.setEmail("client@wasilatti.com");
                        client.setPassword(passwordEncoder.encode("Client@1234"));
                        client.setPhoneNumber("+212600000000");
                        client.getAppRoles().add(userRole);
                        userRepository.save(client);
                        System.out.println("Compte client créé : client / Client@1234");
                }

                // 4. Créer le compte livreur s'il n'existe pas
                if (userRepository.findByUsername("livreur").isEmpty()) {
                        AppUser livreur = new AppUser();
                        livreur.setUsername("livreur");
                        livreur.setEmail("livreur@wasilatti.com");
                        livreur.setPassword(passwordEncoder.encode("Livreur@1234"));
                        livreur.setPhoneNumber("+212611111111");
                        livreur.getAppRoles().add(livreurRole);
                        userRepository.save(livreur);
                        System.out.println("Compte livreur créé : livreur / Livreur@1234");
                }

                // 4b. Créer le profil Driver avec GPS pour le compte livreur
                userRepository.findByUsername("livreur").ifPresent(livreurUser -> {
                        if (driverRepository.findByAppUser(livreurUser).isEmpty()) {
                                Driver driver = new Driver();
                                driver.setAppUser(livreurUser);
                                driver.setFirstName("Livreur");
                                driver.setLastName("Demo");
                                driver.setCin("AB123456");
                                driver.setPhone("+212611111111");
                                driver.setAdresse("Agdal, Rabat");
                                driver.setVehicle(Vehicle.MOTO);
                                driver.setZone("Rabat Centre");
                                driver.setStatus(DriverStatus.HORS_LIGNE);
                                geoLocationService.enrichDriverLocation(driver);
                                driverRepository.save(driver);
                                System.out.println("Profil livreur créé avec GPS : Rabat Centre");
                        }
                });

                // 5. Seed collaborateurs
                if (collaboratorRepository.count() == 0) {
                        Image techImg = new Image();
                        techImg.setImage_url("https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600");
                        techImg.setPublicId("seed_collab_techmaroc");
                        imageRepository.save(techImg);
                        Collaborator c1 = new Collaborator();
                        c1.setName("TechMaroc");
                        c1.setImage(techImg);
                        collaboratorRepository.save(c1);

                        Image fashionImg = new Image();
                        fashionImg.setImage_url("https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600");
                        fashionImg.setPublicId("seed_collab_fashionstore");
                        imageRepository.save(fashionImg);
                        Collaborator c2 = new Collaborator();
                        c2.setName("FashionStore");
                        c2.setImage(fashionImg);
                        collaboratorRepository.save(c2);

                        Image freshImg = new Image();
                        freshImg.setImage_url("https://images.unsplash.com/photo-1542838132-92c53300491e?w=600");
                        freshImg.setPublicId("seed_collab_freshmarche");
                        imageRepository.save(freshImg);
                        Collaborator c3 = new Collaborator();
                        c3.setName("FreshMarché");
                        c3.setImage(freshImg);
                        collaboratorRepository.save(c3);

                        System.out.println("Collaborateurs créés avec images : TechMaroc, FashionStore, FreshMarché");
                }

                // 6. Seed catégories (9 au total)
                if (categoryRepository.count() == 0) {
                        List<Collaborator> collabs = collaboratorRepository.findAll();
                        Collaborator techCollab = collabs.get(0);
                        Collaborator fashionCollab = collabs.get(1);
                        Collaborator freshCollab = collabs.get(2);

                        saveCategory("Électronique", "Smartphones, tablettes, accessoires tech", techCollab);
                        saveCategory("Vêtements", "Mode homme, femme et enfant", fashionCollab);
                        saveCategory("Alimentation", "Produits frais, épicerie et boissons", freshCollab);
                        saveCategory("Cosmétiques", "Soins du visage, maquillage et parfums", fashionCollab);
                        saveCategory("Sport", "Équipements et vêtements de sport", techCollab);
                        saveCategory("Maison", "Décoration, cuisine et électroménager", freshCollab);
                        saveCategory("Fleuriste", "Bouquets, plantes et compositions florales", freshCollab);
                        saveCategory("Restaurant", "Plats préparés, menus et spécialités", freshCollab);
                        saveCategory("Supermarché", "Courses du quotidien livrées à domicile", freshCollab);

                        System.out.println("✅ 9 catégories créées.");
                }

                // 7. Seed produits avec images
                if (productRepository.count() == 0) {
                        List<Category> cats = categoryRepository.findAll();
                        Category electronics = findCat(cats, "Électronique");
                        Category clothing = findCat(cats, "Vêtements");
                        Category food = findCat(cats, "Alimentation");
                        Category cosmetics = findCat(cats, "Cosmétiques");
                        Category sports = findCat(cats, "Sport");
                        Category home = findCat(cats, "Maison");
                        Category fleuriste = findCat(cats, "Fleuriste");
                        Category restaurant = findCat(cats, "Restaurant");
                        Category supermarche = findCat(cats, "Supermarché");

                        // ── Électronique ──────────────────────────────────────────────────────
                        saveProduct("iPhone 15 Pro",
                                        "Smartphone Apple puce A17 Pro, 256 Go, titane naturel",
                                        "Apple", 12999.00, 8, true, 10, electronics,
                                        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600");
                        saveProduct("Samsung Galaxy S24 Ultra",
                                        "S-Pen intégré, capteur 200 Mpx, 512 Go",
                                        "Samsung", 14499.00, 5, false, 0, electronics,
                                        "https://images.unsplash.com/photo-1706741435040-c9b97e044cf6?w=600");
                        saveProduct("MacBook Air M3",
                                        "Laptop ultra-léger, 15\", 16 Go RAM, 512 Go SSD",
                                        "Apple", 18999.00, 3, true, 15, electronics,
                                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600");
                        saveProduct("Sony WH-1000XM5",
                                        "Casque Bluetooth à réduction de bruit de classe mondiale",
                                        "Sony", 3499.00, 20, false, 0, electronics,
                                        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600");
                        saveProduct("iPad Pro 11\"",
                                        "Tablette Apple avec puce M4, écran Liquid Retina XDR",
                                        "Apple", 10999.00, 7, true, 5, electronics,
                                        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600");

                        // ── Vêtements ─────────────────────────────────────────────────────────
                        saveProduct("T-shirt Premium Coton",
                                        "T-shirt unisexe 100% coton biologique, coupe droite",
                                        "BasicCo", 199.00, 100, false, 0, clothing,
                                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600");
                        saveProduct("Jean Slim Fit Homme",
                                        "Jean stretch délavé, coupe ajustée, taille 28-40",
                                        "DenimX", 599.00, 60, true, 20, clothing,
                                        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600");
                        saveProduct("Robe d'été Fleurie",
                                        "Robe légère mousseline imprimé fleuri, tailles S-XL",
                                        "FloraMode", 449.00, 45, false, 0, clothing,
                                        "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600");
                        saveProduct("Veste en Cuir Noir",
                                        "Veste moto en cuir véritable, doublure tissu",
                                        "LeatherCraft", 1299.00, 15, true, 10, clothing,
                                        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600");
                        saveProduct("Sneakers Urban Classic",
                                        "Chaussures de ville en toile, semelle caoutchouc",
                                        "UrbanSteps", 799.00, 80, false, 0, clothing,
                                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600");

                        // ── Alimentation ──────────────────────────────────────────────────────
                        saveProduct("Huile d'Olive Extra Vierge",
                                        "Huile première pression à froid, 1 litre, origine Maroc",
                                        "OliveGold", 89.00, 200, false, 0, food,
                                        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600");
                        saveProduct("Miel de Montagne Pur",
                                        "Miel naturel non pasteurisé, 500 g, récolte locale",
                                        "HoneyFarm", 120.00, 150, true, 10, food,
                                        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600");
                        saveProduct("Panier de Fruits Bio",
                                        "Assortiment fruits de saison biologiques, 5 kg",
                                        "FreshMarché", 250.00, 80, false, 0, food,
                                        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600");
                        saveProduct("Café Arabica Grand Cru",
                                        "Grains de café moulu 100% Arabica, 500 g",
                                        "BrewHouse", 145.00, 300, true, 5, food,
                                        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600");
                        saveProduct("Épices Marocaines Signature",
                                        "Mélange ras-el-hanout, curcuma, paprika fumé",
                                        "SpiceLab", 55.00, 500, false, 0, food,
                                        "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600");

                        // ── Cosmétiques ───────────────────────────────────────────────────────
                        saveProduct("Crème Hydratante SPF50",
                                        "Soin visage anti-UV, texture légère, peaux mixtes",
                                        "GlowSkin", 299.00, 120, true, 15, cosmetics,
                                        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600");
                        saveProduct("Sérum Vitamine C",
                                        "Sérum éclaircissant 20% vitamine C pure, 30 ml",
                                        "GlowSkin", 349.00, 90, false, 0, cosmetics,
                                        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600");
                        saveProduct("Parfum Oud Royal",
                                        "Eau de Parfum Oriental, notes boisées, 100 ml",
                                        "MystikScent", 899.00, 40, true, 10, cosmetics,
                                        "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600");

                        // ── Sport ─────────────────────────────────────────────────────────────
                        saveProduct("Vélo Électrique Urbain",
                                        "Vélo e-bike 25 km/h, autonomie 80 km, pliable",
                                        "EcoRide", 12500.00, 10, false, 0, sports,
                                        "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600");
                        saveProduct("Tapis de Yoga Premium",
                                        "Tapis antidérapant 6 mm, eco-friendly, sac inclus",
                                        "YogaPure", 349.00, 200, true, 20, sports,
                                        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600");
                        saveProduct("Gants de Boxe Pro",
                                        "Gants cuir synthétique 12 oz, rembourrage triple",
                                        "FightZone", 449.00, 60, false, 0, sports,
                                        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600");

                        // ── Maison ────────────────────────────────────────────────────────────
                        saveProduct("Robot Cuiseur Multifonction",
                                        "15 programmes, bol 5L, vapeur, hachoir intégré",
                                        "KitchenPro", 2499.00, 25, true, 10, home,
                                        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600");
                        saveProduct("Lampe LED Architecte",
                                        "Lampe de bureau ajustable, 3 températures de blanc, USB-C",
                                        "LuxLight", 399.00, 70, false, 0, home,
                                        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600");
                        saveProduct("Ensemble Draps Bambou",
                                        "Parure de lit 220x240, 400 fils, 4 pièces, blanc cassé",
                                        "SleepWell", 599.00, 50, true, 15, home,
                                        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600");

                        // ── Fleuriste ─────────────────────────────────────────────────────────
                        saveProduct("Bouquet Rose Rouge 24 tiges",
                                        "24 roses rouges longues tiges, emballage kraft premium",
                                        "FloraMaroc", 350.00, 30, true, 10, fleuriste,
                                        "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600");
                        saveProduct("Orchidée Blanche en Pot",
                                        "Orchidée Phalaenopsis, pot céramique blanc, 2 à 3 hampes",
                                        "FloraMaroc", 280.00, 20, false, 0, fleuriste,
                                        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600");
                        saveProduct("Composition Mariage Luxe",
                                        "Arrangement floral mariage : pivoines, lisianthus et eucalyptus",
                                        "WeddingFlora", 1200.00, 10, false, 0, fleuriste,
                                        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600");
                        saveProduct("Plante Succulente Cactus Mix",
                                        "Trio de succulentes, pots terra cotta, entretien facile",
                                        "GreenHome", 150.00, 80, true, 5, fleuriste,
                                        "https://images.unsplash.com/photo-1446071103084-c257b5f70672?w=600");
                        saveProduct("Bouquet Champêtre Séché",
                                        "Pampas, lavande, blé séché et eucalyptus – déco tendance",
                                        "NaturaDeco", 220.00, 40, false, 0, fleuriste,
                                        "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600");

                        // ── Restaurant ────────────────────────────────────────────────────────
                        saveProduct("Tajine Poulet Citron Confit",
                                        "Tajine maison au poulet fermier, citron confit et olives, servi chaud",
                                        "ChezKhadija", 85.00, 50, false, 0, restaurant,
                                        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600");
                        saveProduct("Pizza Margherita XXL",
                                        "Pizza 40 cm, mozzarella di Bufala, tomates San Marzano, basilic frais",
                                        "PizzaNapoli", 120.00, 40, true, 15, restaurant,
                                        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600");
                        saveProduct("Sushi Box Premium 24 pièces",
                                        "Assortiment salmon, thon, crevette – sauces incluses",
                                        "TokyoFusion", 180.00, 30, false, 0, restaurant,
                                        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600");
                        saveProduct("Burger Wagyu Gourmet",
                                        "Steak wagyu 200g, cheddar affiné, brioche artisanale, frites maison",
                                        "UrbanGrill", 145.00, 35, true, 10, restaurant,
                                        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600");
                        saveProduct("Couscous Royal Marocain",
                                        "Couscous semoule fine, 7 légumes, merguez, poulet et agneau",
                                        "ChezKhadija", 95.00, 25, false, 0, restaurant,
                                        "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600");

                        // ── Supermarché ───────────────────────────────────────────────────────
                        saveProduct("Lait Entier Bio 1L",
                                        "Lait entier pasteurisé bio, vache élevée en plein air",
                                        "FarmFresh", 18.00, 500, false, 0, supermarche,
                                        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600");
                        saveProduct("Pack Eau Minérale 6x1.5L",
                                        "Eau minérale naturelle des sources marocaines, pack de 6 bouteilles",
                                        "SidiAli", 35.00, 300, true, 5, supermarche,
                                        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600");
                        saveProduct("Yaourt Nature x8",
                                        "Yaourts nature brassés, pot en verre, sans colorants ni conservateurs",
                                        "DanoneMaroc", 42.00, 200, false, 0, supermarche,
                                        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600");
                        saveProduct("Pain de Campagne 500g",
                                        "Pain artisanal au levain naturel, croûte croustillante",
                                        "BoulangerieDuCoin", 12.00, 150, false, 0, supermarche,
                                        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600");
                        saveProduct("Paquet Pâtes Linguine 500g",
                                        "Pâtes au blé dur semoule fine, cuisson rapide 8 min",
                                        "Barilla", 22.00, 400, true, 10, supermarche,
                                        "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600");

                        System.out.println("✅ 38 produits créés avec images dans 9 catégories.");
                }

                // Mettre à jour les produits existants s'ils n'ont pas de dépôt
                List<Product> allProducts = productRepository.findAll();
                boolean needsUpdate = false;
                for (Product p : allProducts) {
                        if (p.getDepotAddress() == null || p.getDepotAddress().trim().isEmpty()) {
                                int depotIndex = random.nextInt(OUJDA_DEPOT_ADDRESSES.length);
                                p.setDepotAddress(OUJDA_DEPOT_ADDRESSES[depotIndex]);
                                p.setDepotLatitude(OUJDA_DEPOT_LATS[depotIndex]);
                                p.setDepotLongitude(OUJDA_DEPOT_LNGS[depotIndex]);
                                needsUpdate = true;
                        }
                }
                if (needsUpdate) {
                        productRepository.saveAll(allProducts);
                        System.out.println("✅ Dépôts d'Oujda assignés aux produits existants.");
                }

                // 8. Seed client users and evaluations if empty
                if (evaluationRepository.count() == 0) {
                        AppUser client1 = getOrCreateClient("karim_benali", "karim@wasilatti.com", "+212600000001",
                                        userRole);
                        AppUser client2 = getOrCreateClient("samira_alaoui", "samira@wasilatti.com", "+212600000002",
                                        userRole);
                        AppUser client3 = getOrCreateClient("youssef_marrakchi", "youssef@wasilatti.com",
                                        "+212600000003", userRole);

                        Driver driver = driverRepository.findAll().stream().findFirst().orElse(null);
                        if (driver != null) {
                                createSeedEvaluation(client1, driver, 5,
                                                "Wasilatti a changé ma façon de commander. La livraison est toujours rapide et les livreurs sont super sympas. Je recommande à 100% !");
                                createSeedEvaluation(client2, driver, 5,
                                                "Grâce à Wasilatti, nous avons augmenté nos ventes de 40%. La plateforme est intuitive et le support client est excellent.");
                                createSeedEvaluation(client3, driver, 5,
                                                "Le suivi en temps réel est incroyable. Je peux voir exactement où est mon livreur et quand il arrivera. Très pratique !");
                                System.out.println("✅ 3 évaluations de test créées.");
                        }
                }
        }

        private AppUser getOrCreateClient(String username, String email, String phone, AppRole userRole) {
                return userRepository.findByUsername(username)
                                .orElseGet(() -> {
                                        AppUser u = new AppUser();
                                        u.setUsername(username);
                                        u.setEmail(email);
                                        u.setPassword(passwordEncoder.encode("Client@1234"));
                                        u.setPhoneNumber(phone);
                                        if (userRole != null) {
                                                u.getAppRoles().add(userRole);
                                        }
                                        return userRepository.save(u);
                                });
        }

        private void createSeedEvaluation(AppUser client, Driver driver, int rating, String comment) {
                Order order = new Order();
                order.setClient(client);
                order.setStatus(com.backend.wasilatti.model.enums.OrderStatus.LIVRÉE);
                order.setDeliveryAddress("Agdal, Rabat");
                order.setTotalPrice(150.0);
                order.setLivreur(driver.getAppUser());
                order.setDriverAccepted(true);
                order = orderRepository.save(order);

                Evaluation eval = new Evaluation();
                eval.setOrder(order);
                eval.setClient(client);
                eval.setDriver(driver);
                eval.setRating(rating);
                eval.setComment(comment);
                evaluationRepository.save(eval);
        }

        // ── Helpers ───────────────────────────────────────────────────────────────

        private void saveCategory(String name, String description, Collaborator collab) {
                Category cat = new Category();
                cat.setName(name);
                cat.setDescription(description);
                cat.setCollaborator(collab);
                categoryRepository.save(cat);
        }

        private Category findCat(List<Category> cats, String name) {
                return cats.stream()
                                .filter(c -> c.getName().equals(name))
                                .findFirst()
                                .orElse(null);
        }

        private void saveProduct(String name, String description, String brand,
                        double price, int quantity,
                        boolean inPromotion, int promoPercent,
                        Category category, String imageUrl) {
                Product p = new Product();
                p.setName(name);
                p.setDescription(description);
                p.setBrand(brand);                
                p.setPrice(price);
                p.setQuantity(quantity);
                p.setInPromotion(inPromotion);
                p.setPromotionPercentage(promoPercent);
                p.setCategory(category);
                p.setCollaborator(category.getCollaborator()); // <-- ajout : cohérence garantie avec la catégorie
                p.setSizes(new ArrayList<>());
                
                int depotIndex = random.nextInt(OUJDA_DEPOT_ADDRESSES.length);
                p.setDepotAddress(OUJDA_DEPOT_ADDRESSES[depotIndex]);
                p.setDepotLatitude(OUJDA_DEPOT_LATS[depotIndex]);
                p.setDepotLongitude(OUJDA_DEPOT_LNGS[depotIndex]);
                
                productRepository.save(p);

                Image img = new Image();
                img.setImage_url(imageUrl);
                img.setPublicId("seed_" + name.toLowerCase().replaceAll("[^a-z0-9]", "_"));
                img.setProduct(p);
                imageRepository.save(img);
        }
}