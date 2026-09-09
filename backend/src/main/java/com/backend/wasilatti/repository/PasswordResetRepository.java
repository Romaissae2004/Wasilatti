package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.PasswordResetToken; //l’entité liée à ce repository
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;

public interface PasswordResetRepository extends JpaRepository<PasswordResetToken, Long> {
    PasswordResetToken findByToken(String token);
    /* SELECT * FROM password_reset_token
       WHERE token = ?
       Si le token existe :retourne l’objet , Sinon :retourne null*/
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(Date now);
}
//Elle sert à communiquer avec la DB pour l’entité PasswordResetToken
//Ce repository gère l’entité PasswordResetToken dont la clé primaire est de type Long
/*Pourquoi extends JpaRepository ?
Grâce à ça, Spring crée automatiquement plein de méthodes sans que je les écrives
je récupères automatiquement :
save():sauvegarder
findById():chercher par id
findAll():récupérer tous
delete():supprimer
existsById():vérifier existence
* */