package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    // Ces méthodes sont suffisantes
    Optional<Client> findByEmail(String email);
    Optional<Client> findByUserId(Long userId);
    boolean existsByEmail(String email);
    boolean existsByUserId(Long userId);
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c FROM Client c " +
           "WHERE c.emetteur.id = :emetteurId " +
           "OR EXISTS (SELECT 1 FROM Facture f WHERE f.acheteurClient = c AND f.vendeur.id = :emetteurId) " +
           "OR EXISTS (SELECT 1 FROM Devis d WHERE d.acheteurClient = c AND d.vendeur.id = :emetteurId) " +
           "OR EXISTS (SELECT 1 FROM BonCommande bc WHERE bc.acheteurClient = c AND bc.vendeur.id = :emetteurId)")
    List<Client> findAllByEmetteurId(@org.springframework.data.repository.query.Param("emetteurId") Long emetteurId);
}