package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import jakarta.transaction.Transactional;
import java.util.Date;

/*je sers ici à gérer les tokens blacklistés dans la DB(les JWT que je veux bloquer)
il permet de communiquer avec la DB sans écrire bcp de SQL.Grâce à JpaRepository,j'ai déjà :
save() : enregistrer un token , findAll() :récupérer les tokens et delete():supprimer*/
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, Long> {

    boolean existsByToken(String token);//Vérifier si un token est blacklisté=Est-ce que ce token existe dans la blacklist ?true:token interdit,false:token valide
    //Supprimer les tokens expirés
    @Modifying //obligatoire car c’est une requête qui modifie (DELETE)
    @Transactional //garantit que l’op est bien exécutée (sécurité base)
    @Query("DELETE FROM BlacklistedToken t WHERE t.expiresAt < :now")//@Query:requête personnalisée(JPQL),supprimer where tokens expirés donc je supprimes tous les tokens déjà inutiles.Pour éviter:une DB trop lourde et garder seulement les tokens actifs
    void deleteExpiredTokens(Date now);
}

/*Ce repository te permet de : vérifier si un token est blacklisté,supprimer les anciens tokens expirés et gérer les données facilement
C’est l’outil qui me permets de gérer la blacklist des JWT dans la DB*/