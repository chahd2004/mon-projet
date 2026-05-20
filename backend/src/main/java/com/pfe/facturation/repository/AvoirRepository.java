package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Avoir;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AvoirRepository extends JpaRepository<Avoir, Long> {

    // trouve tous les avoirs lies a une facture
    List<Avoir> findByFactureSourceId(Long factureId);

    // trouve les avoirs d'un vendeur
    List<Avoir> findByVendeurId(Long vendeurId);

    // pour la generation du numero sequentiel
    Optional<Avoir> findTopByNumAvoirStartingWithOrderByNumAvoirDesc(String prefix);
}