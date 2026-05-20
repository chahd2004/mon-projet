package com.pfe.facturation.repository;

import com.pfe.facturation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);

    // Récupérer tous les collaborateurs associés à une entreprise (via le champ entreprise)
    List<User> findByEntrepriseId(Long entrepriseId);
}