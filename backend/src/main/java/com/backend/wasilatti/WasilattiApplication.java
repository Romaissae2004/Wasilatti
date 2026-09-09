package com.backend.wasilatti;

import com.backend.wasilatti.service.AccountService;
import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
@SpringBootApplication //démarre l’application,charge les configurations et détecte les classes (@Service, @Controller
@EnableScheduling //Ça active les tâches automatiques(programmées=planifiées),Grâce à ça,Spring va exécuter les méthodes avec @Scheduled
/*@EnableGlobalMethodSecurity(prePostEnabled = true,securedEnabled = true)*/
public class WasilattiApplication {

    @Value("${DEV_ADMIN_PASSWORD:}")
    private String adminPw;

    @Value("${DEV_USER_PASSWORD:}")
    private String userPw;

    public static void main(String[] args) {
        SpringApplication.run(WasilattiApplication.class, args);
    }
    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder(); // BCrypt c'est pour hasher le mdp à partir de hash il est presque impossible de trouver le mdp originale,pour encoder les mdps les crypte meilleure facon est d'aller à la couche servicer
        /*qd je crypte un mdp avec BCrypt ca donne pas tjr la meme valeur meme si je viens de crypter le meme mdp car qd il hashe il utilise la date sys il change la val selon la date de sys donc val diff*/
    }
    @Bean
    @Profile("dev") //Le CommandLineRunner s’exécute seulement en mode développement (dev).Donc :en développement: les utilisateurs/tests sont créés,en production : ce code est ignoré
        // tt les méthodes que je veux tester sont dans AccountService
    CommandLineRunner start(AccountService accountService, AppUserRepository appUserRepository, PasswordEncoder passwordEncoder){
        return args -> {
                if (adminPw == null || adminPw.isBlank()) {
                    throw new IllegalStateException(
                            "DEV_ADMIN_PASSWORD non définie dans application-dev.properties"
                    );
                }
                if (userPw == null || userPw.isBlank()) {
                    throw new IllegalStateException(
                            "DEV_USER_PASSWORD non définie dans application-dev.properties"
                    );
                }
                //sinon: créer les données
                //Ajouter des roles
                accountService.getOrCreateRole("USER");
                accountService.getOrCreateRole("ADMIN");
                accountService.getOrCreateRole("CLIENT");
                accountService.getOrCreateRole("LIVREUR");
                accountService.getOrCreateRole("MARCHAND");

                //ajouter des users
                /*
                 * Mots de passe lus depuis les variables d'environnement.
                 */
                /*Au lieu d’écrire les mdps directement dans le code ("Test@1234"), ils sont lus depuis l’environnement.
                Plus sécurisé car :le mdp n’est pas visible dans GitHub.chaque machine peut avoir son propre mot de passe*/

                if (accountService.loadUserByUsername("user1") == null && accountService.loadUserByEmail("user1@example.com") == null) {
                    accountService.registerUser(new AppUser(null, "user1", "user1@example.com", userPw, new ArrayList<>()), true);
                }

                AppUser admin = appUserRepository.findByUsername("admin").orElse(null);
                if (admin == null) {
                    accountService.registerUser(new AppUser(null, "admin", "admin@example.com", adminPw, new ArrayList<>()), true);
                    accountService.addRoleToUser("admin", "ADMIN");
                } else {
                    // Si l'admin existe déjà (par ex. créé par DataInitializer lors d'une exécution précédente),
                    // on met à jour son email et son mot de passe pour correspondre aux propriétés dev.
                    admin.setEmail("admin@example.com");
                    admin.setPassword(passwordEncoder.encode(adminPw));
                    appUserRepository.save(admin);
                }

                if (accountService.loadUserByUsername("user2") == null && accountService.loadUserByEmail("user2@example.com") == null) {
                    accountService.registerUser(new AppUser(null, "user2", "user2@example.com", userPw, new ArrayList<>()), true);
                    accountService.addRoleToUser("user2", "CLIENT");
                }

                if (accountService.loadUserByUsername("user3") == null && accountService.loadUserByEmail("user3@example.com") == null) {
                    accountService.registerUser(new AppUser(null, "user3", "user3@example.com", userPw, new ArrayList<>()), true);
                    accountService.addRoleToUser("user3", "CLIENT");
                    accountService.addRoleToUser("user3", "LIVREUR");
                }

                if (accountService.loadUserByUsername("user4") == null && accountService.loadUserByEmail("user4@example.com") == null) {
                    accountService.registerUser(new AppUser(null, "user4", "user4@example.com", userPw, new ArrayList<>()), true);
                    accountService.addRoleToUser("user4", "MARCHAND");
                }
        };
    }

}
