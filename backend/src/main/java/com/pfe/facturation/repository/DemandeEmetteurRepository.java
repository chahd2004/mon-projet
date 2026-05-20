package com.pfe.facturation.repository;

import com.pfe.facturation.entity.DemandeEmetteur;
import com.pfe.facturation.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeEmetteurRepository extends JpaRepository<DemandeEmetteur, Long> {
    List<DemandeEmetteur> findByStatus(AccountStatus status);
    Optional<DemandeEmetteur> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByMatriculeFiscal(String matriculeFiscal);
}