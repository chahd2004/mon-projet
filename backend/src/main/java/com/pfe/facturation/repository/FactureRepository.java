package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    // Gardez vos méthodes existantes
    List<Facture> findByVendeurId(Long vendeurId);
    List<Facture> findByAcheteurClientId(Long clientId);
    List<Facture> findByAcheteurEmetteurId(Long emetteurId);
    Optional<Facture> findTopByNumFactStartingWithOrderByNumFactDesc(String prefix);
    Optional<Facture> findTopByNumFactStartingWithOrderByIdDesc(String prefix);


}