package com.pfe.facturation.repository;

import com.pfe.facturation.entity.BonLivraison;
import com.pfe.facturation.enums.StatutBonLivraison;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BonLivraisonRepository extends JpaRepository<BonLivraison, Long> {

    // bons de livraison d'un vendeur
    List<BonLivraison> findByVendeurId(Long vendeurId);

    // bons de livraison d'un acheteur client
    List<BonLivraison> findByAcheteurClientId(Long clientId);

    // bons de livraison d'un acheteur emetteur
    List<BonLivraison> findByAcheteurEmetteurId(Long emetteurId);

    // bons de livraison par statut pour un vendeur
    List<BonLivraison> findByVendeurIdAndStatut(Long vendeurId, StatutBonLivraison statut);

    // pour la generation du numero sequentiel
    Optional<BonLivraison> findTopByNumBonLivraisonStartingWithOrderByNumBonLivraisonDesc(
            String prefix);

    Optional<BonLivraison> findByNumBonLivraison(String numBonLivraison);

    // trouver par reference de commande
    List<BonLivraison> findByCommandeSourceRef(String commandeSourceRef);
}