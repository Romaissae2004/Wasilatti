package com.backend.wasilatti.repository;

import com.backend.wasilatti.model.entity.Driver;
import com.backend.wasilatti.model.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    List<Evaluation> findByDriver_AppUser_UsernameOrderByCreatedAtDesc(String username);

    Optional<Evaluation> findByOrder_Id(Long orderId);

    @Query("SELECT AVG(e.rating) FROM Evaluation e WHERE e.driver = :driver")
    Double getAverageRatingByDriver(@Param("driver") Driver driver);
}
