package com.backend.wasilatti.service;

import com.backend.wasilatti.exception.ResourceNotFoundException;
import com.backend.wasilatti.exception.DuplicateResourceException;
import com.backend.wasilatti.model.entity.AppRole;
import com.backend.wasilatti.model.entity.AppUser;
import com.backend.wasilatti.repository.AppRoleRepository;
import com.backend.wasilatti.repository.AppUserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional // Toutes les méthodes s'exécutent dans une transaction
public class AccountServiceImpl implements AccountService {
    private final AppUserRepository appUserRepository;
    private final AppRoleRepository appRoleRepository;
    private final PasswordEncoder passwordEncoder;

    // Injection de dépendances via constructeur (recommandé plutôt que @Autowired)
    public AccountServiceImpl(AppUserRepository appUserRepository, AppRoleRepository appRoleRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.appRoleRepository = appRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AppRole addNewRole(AppRole appRole) {
        return appRoleRepository.save(appRole);
    }

    @Override
    public void addRoleToUser(String username, String roleName) {
        // Correction : Utilisation de orElseThrow pour extraire la valeur de l'Optional ou lever l'exception
        AppUser appUser = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + username));

        AppRole appRole = getOrCreateRole(roleName);

        // Ajout du rôle à la collection de l'utilisateur
        appUser.getAppRoles().add(appRole);

        // Grâce au contexte transactionnel (@Transactional), Hibernate va détecter le changement
        // dans la collection appRoles et insérer automatiquement la ligne dans la table d'association au commit.
    }

    @Override
    public AppUser loadUserByUsername(String username) {
        // Correction : On extrait l'objet de l'Optional ou on retourne null s'il n'existe pas
        return appUserRepository.findByUsername(username).orElse(null);
    }

    @Override
    public List<AppUser> listUsers() {
        return appUserRepository.findAll();
    }

    @Override
    public AppUser loadUserByEmail(String email) {
        // Correction : On extrait l'objet de l'Optional ou on retourne null
        return appUserRepository.findByEmail(email).orElse(null);
    }

    @Override
    public AppUser loadUserByUsernameOrEmail(String usernameOrEmail) {
        return appUserRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail).orElse(null);
    }

    @Override
    public AppRole getOrCreateRole(String roleName) {
        // On cherche le rôle, s'il n'existe pas (.orElseGet), on le crée et on le sauvegarde
        return appRoleRepository.findByRoleName(roleName)
                .orElseGet(() -> appRoleRepository.save(new AppRole(null, roleName)));
    }

    @Override
    public AppUser registerUser(AppUser appUser, boolean encodePassword) {
        // Correction : Utilisation de .isPresent() sur l'Optional pour vérifier les doublons
        if (appUserRepository.findByUsername(appUser.getUsername()).isPresent()) {
            throw new DuplicateResourceException("Nom d'utilisateur déjà utilisé");
        }
        if (appUser.getEmail() != null && !appUser.getEmail().trim().isEmpty()) {
            if (appUserRepository.findByEmail(appUser.getEmail()).isPresent()) {
                throw new DuplicateResourceException("Email déjà utilisé");
            }
        }

        if (encodePassword) {
            appUser.setPassword(passwordEncoder.encode(appUser.getPassword()));
        }

        // Assigner les rôles demandés ou attribuer le rôle par défaut USER
        java.util.Collection<AppRole> rolesToAssign = new java.util.ArrayList<>();
        if (appUser.getAppRoles() != null && !appUser.getAppRoles().isEmpty()) {
            for (AppRole requestedRole : appUser.getAppRoles()) {
                if (requestedRole.getRoleName() != null && !requestedRole.getRoleName().isBlank()) {
                    rolesToAssign.add(getOrCreateRole(requestedRole.getRoleName()));
                }
            }
        }
        if (rolesToAssign.isEmpty()) {
            rolesToAssign.add(getOrCreateRole("USER"));
        }
        appUser.setAppRoles(rolesToAssign);

        // Sauvegarder l'utilisateur avec son rôle associé
        return appUserRepository.save(appUser);
    }

    @Override
    public void removeRoleFromUser(String username, String roleName) {
        AppUser appUser = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + username));

        AppRole appRole = appRoleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Rôle introuvable : " + roleName));

        appUser.getAppRoles().remove(appRole);
    }

    @Override
    public void deleteUser(Long id) {
        if (appUserRepository.existsById(id)) {
            appUserRepository.deleteById(id);
        }
    }
}