package com.backend.wasilatti.model.entity; //Le package où se trouve cette classe

import jakarta.persistence.*; //pour utiliser JPA/Hibernate (@Entity, @Id, ...)
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date; //pour stocker la date d’expiration du token

/*Cette classe représente une entité JPA qui sert généralement dans un sys "Mot de passe oublié"
Quand un utilisateur clique sur "Forgot Password", on génère un token unique envoyé par email
Cette classe permet de sauvegarder ce token dans la DB*/

@Entity //Cette classe sera transformée en table dans la DB,La table s’appellera probablement :password_reset_token (selon la configuration Hibernate)
@Data
@NoArgsConstructor
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //l’id sera généré automatiquement
    private Long id;

    private String token; //Le token unique envoyé par email,Le lien envoyé peut être :http://localhost:8080/reset-password?token=a8f7b2c9d1
    private String email; //L’email de l’utilisateur qui a demandé la réinitialisation
    private Date expiresAt; //Date limite du token,Après expiration:le token devient invalide.
    private boolean used = false;//Sert à savoir si le token a déjà été utilisé.false:pas encore utilisé,true:déjà utilisé

    public PasswordResetToken(String token, String email, Date expiresAt) {
        this.token = token;
        this.email = email;
        this.expiresAt = expiresAt;
    }
    //public void setUsed(boolean used) { this.used = used; } Permet de modifier used,Quand le mot de passe est changé avec succès.
}
/*1. Utilisateur clique “Forgot Password”
Backend :génère un token+sauvegarde en DB
2. Envoi email
Lien :http://frontend/reset-password?token=xyz
3. Utilisateur ouvre le lien
Backend vérifie :
token existe ?
pas expiré ?
pas déjà utilisé ?
4. Nouveau mot de passe
Si valide :
mot de passe changé
token devient utilisé, token.setUsed(true);

Cette classe sert à :
stocker un token de réinitialisation
savoir à quel email il appartient
vérifier s’il est expiré
empêcher la réutilisation du lien
*/