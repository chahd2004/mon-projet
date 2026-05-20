package com.pfe.facturation.repository;

import com.pfe.facturation.entity.BonCommande;
import com.pfe.facturation.enums.StatutBonCommande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BonCommandeRepository extends JpaRepository<BonCommande, Long> {

    // bons de commande d'un vendeur
    List<BonCommande> findByVendeurId(Long vendeurId);

    // bons de commande d'un acheteur client
    List<BonCommande> findByAcheteurClientId(Long clientId);

    // bons de commande d'un acheteur emetteur
    List<BonCommande> findByAcheteurEmetteurId(Long emetteurId);

    // bons de commande par statut pour un vendeur
    List<BonCommande> findByVendeurIdAndStatut(Long vendeurId, StatutBonCommande statut);

    // pour la generation du numero sequentiel
    Optional<BonCommande> findTopByNumBonCommandeStartingWithOrderByNumBonCommandeDesc(String prefix);

    Optional<BonCommande> findByNumBonCommande(String numBonCommande);
}