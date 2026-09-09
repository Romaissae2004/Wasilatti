package com.backend.wasilatti.model.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.Collection;
@Entity
@Data @NoArgsConstructor @AllArgsConstructor
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nom d'utilisateur obligatoire")
    @Size(min = 3, max = 20, message = "Nom d'utilisateur doit contenir entre 3 et 20 caractères")
    @Column(unique = true) /*Username unique en BD */
    private String username;

    @NotBlank(message = "Email obligatoire")
    @Size(max = 100, message = "Email ne doit pas dépasser 100 caractères")
    @Email(message = "Format email invalide")
    @Pattern(
            regexp = "^[a-zA-Z0-9]([a-zA-Z0-9._%+\\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9\\-]*[a-zA-Z0-9])?\\.[a-zA-Z]{2,}(\\.[a-zA-Z]{2,})?$",
            message = "Email invalide — exemple valide : romaissae.merzak@gmail.com"
    )
    @Column(unique = true)/* Email unique en BD ca dit à la DB de refuser deux emails identiques*/

    private String email;
    @Size(min = 8,max = 255,message = "Mot de passe doit contenir entre 8 et 255 caractères")
    @Column(length = 255)
    /*je veux que je n'affiche pas mdp ds JSON apres faire /users voir la listes des users*/
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) /*en écriture je laisse, je peux prendre la val je la stocke mais qd j'utilise les getters et setters il va l'ignorer: c'est une méthode pour protéger le mdp pour qu'il ne soit pas visible en format de JSON  */
    @NotBlank(message = "Mot de passe obligatoire")
    @Pattern(
            regexp = "^(?!.*\\s)(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!*\\-_]).{8,255}$",
            message = "Mot de passe doit contenir au moins : 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial (@#$%^&+=!*-_), sans espaces"
    )
    private String password;

    private String phoneNumber;

    @OneToOne(mappedBy = "user")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Collaborator collaborator;

    @ManyToMany(fetch = FetchType.EAGER) /* Une relation de type ManyToMany car un user peut avoir plusieurs roles et un role concerne plusieurs users + LAZY: si je charge un objet user à partir de BD il ne va pas charger automatiquement les roles de ce user il va les charger uniquement si j'aurai besoin , EAGER :dès que je charge un user j'ai les roles de ce user ds cette collection*/ /* qd j'utilise EAGER il est préférable d'initialiser cette collection avec new Arrayist c-à-d qd vous créer un user par défaut la liste des roles est vides et non pas null*/
    private Collection<AppRole> appRoles=new ArrayList<>(); // qd je charge un user j'ai besoin de connaitre les roles de ce user , l'inverse: savoir les users qui ont le meme role ne m'interesse pas

    public AppUser(Long id, String username, String email, String password, Collection<AppRole> appRoles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.phoneNumber = null;
        this.appRoles = appRoles != null ? appRoles : new ArrayList<>();
    }
}
