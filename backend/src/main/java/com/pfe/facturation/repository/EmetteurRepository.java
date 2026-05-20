package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Emetteur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmetteurRepository extends JpaRepository<Emetteur, Long> {
    Optional<Emetteur> findByEmail(String email);
    Optional<Emetteur> findByUserId(Long userId);
    boolean existsByEmail(String email);
    boolean existsByMatriculeFiscal(String matriculeFiscal);
    boolean existsByCode(String code);
    boolean existsByUserId(Long userId);
}