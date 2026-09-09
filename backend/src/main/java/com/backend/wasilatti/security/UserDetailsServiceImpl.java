package com.backend.wasilatti.security;

import com.backend.wasilatti.service.AccountService;
import com.backend.wasilatti.model.entity.AppUser;
import jakarta.transaction.Transactional;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;

@Service
@Transactional
public class UserDetailsServiceImpl implements UserDetailsService {
    private final AccountService accountService;

    public UserDetailsServiceImpl(AccountService accountService){
        this.accountService=accountService;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Récupérer l'utilisateur par son username ou son email en une seule requête combinée (optimisation)
        AppUser appUser = accountService.loadUserByUsernameOrEmail(usernameOrEmail);
        if (appUser == null) {
            throw new UsernameNotFoundException("Identifiants incorrects");
        }
        //je retourne un objet qui contient new user de type spring ce user attend le username , mdp , les roles en spring sécurity c'est une collection de type GrantedAuthority
        //appUser.getAppRoles() est de type d'une collection de roles alors que spring attend une collection de GrantedAuthority donc je dois convertir la collection de AppRoles vers une collection de GrantedAuthority
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        //parcourir la liste des users , pour chaque role appRole ajouter ce role à cette collection
        appUser.getAppRoles().forEach(r -> {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.getRoleName())); // "ROLE_ADMIN"
        });
        return new User(appUser.getUsername(), appUser.getPassword(), authorities);//dès qu'un user saisit son usernme et son mdp fait oi appel à cette méthode et Voila ce que tu vas fair et à la fin du spring sécurité voila l'user qui est authentifié
    }
}
