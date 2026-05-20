package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Devis;
import com.pfe.facturation.enums.StatutDevis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DevisRepository extends JpaRepository<Devis, Long> {

    // ═══════════════════════════════════════════════════════════════════
    // VOS MÉTHODES EXISTANTES (suffisantes pour l'application)
    // ═══════════════════════════════════════════════════════════════════

    List<Devis> findByVendeurId(Long vendeurId);
    List<Devis> findByAcheteurClientId(Long clientId);
    List<Devis> findByAcheteurEmetteurId(Long emetteurId);
    List<Devis> findByVendeurIdAndStatut(Long vendeurId, StatutDevis statut);
    Optional<Devis> findTopByNumDevisStartingWithOrderByNumDevisDesc(String prefix);
    Optional<Devis> findByNumDevis(String numDevis);


}