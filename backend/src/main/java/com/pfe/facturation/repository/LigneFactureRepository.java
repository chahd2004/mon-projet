package com.pfe.facturation.repository;

import com.pfe.facturation.entity.LigneFacture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LigneFactureRepository extends JpaRepository<LigneFacture, Long> {
    List<LigneFacture> findByFactureId(Long factureId);
    List<LigneFacture> findByProduitId(Long produitId);
}