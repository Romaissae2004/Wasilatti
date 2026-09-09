package com.backend.wasilatti.service;

import com.backend.wasilatti.model.entity.AppRole;
import com.backend.wasilatti.model.entity.AppUser;

import java.util.List;

//dans cette interface je déclare les méthodes dont j'en ai besoin dans l'application

public interface AccountService {

    //besoin d'une méthode qui permet d'ajouter un role ds BD, je lui donne un objet de type Approle et il va l'ajouter
    AppRole addNewRole(AppRole approle);

    //une méthode de type void qui permet d'ajouter un role à un user c'est pour affecter un role à un user j'ai besoi de lui donner 2 paramètres username et roleName
    void addRoleToUser(String username, String roleName);

    //une méthode qui premet de retourner un user , je lui donne username il va ds DB et me cherhe l'utilisateur c-à-d  ca me donne l'user je charge un user par son username
    AppUser loadUserByUsername(String username);

    //méthode qui retourne une liste de toutes les users
    List<AppUser> listUsers();

    AppUser loadUserByEmail(String email);

    AppUser loadUserByUsernameOrEmail(String usernameOrEmail);

    AppRole getOrCreateRole(String roleName);

    AppUser registerUser(AppUser appUser, boolean encodePassword);

    void removeRoleFromUser(String username, String roleName);

    void deleteUser(Long id);
}
