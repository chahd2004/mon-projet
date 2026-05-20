package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Commande;
import com.pfe.facturation.enums.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    // commandes d'un vendeur
    List<Commande> findByVendeurId(Long vendeurId);

    // commandes d'un acheteur client
    List<Commande> findByAcheteurClientId(Long clientId);

    // commandes d'un acheteur emetteur
    List<Commande> findByAcheteurEmetteurId(Long emetteurId);

    // commandes par statut pour un vendeur
    List<Commande> findByVendeurIdAndStatut(Long vendeurId, StatutCommande statut);

    // pour la generation du numero sequentiel
    Optional<Commande> findTopByNumCommandeStartingWithOrderByNumCommandeDesc(String prefix);

    // trouver par numCommande
    Optional<Commande> findByNumCommande(String numCommande);
}