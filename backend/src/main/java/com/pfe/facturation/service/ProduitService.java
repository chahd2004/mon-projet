package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.ProduitRequestDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import java.util.List;

public interface ProduitService {

    // CRUD de base
    ProduitResponseDTO create(ProduitRequestDTO request);
    List<ProduitResponseDTO> findAll();
    ProduitResponseDTO findById(Long id);
    ProduitResponseDTO update(Long id, ProduitRequestDTO request);
    void delete(Long id);

    // Gestion de stock
    boolean checkDisponibilite(Long produitId, int quantite);
    ProduitResponseDTO updateStock(Long id, Integer nouvelleQuantite);
    List<ProduitResponseDTO> getProduitsStockFaible(Long emetteurId);
    List<ProduitResponseDTO> getProduitsRuptureStock(Long emetteurId);

    // Méthodes spécifiques
    boolean isOwner(Long produitId, Long emetteurId);
    List<ProduitResponseDTO> getProduitsByEmetteur(Long emetteurId);
    long count();
    long countByEmetteurId(Long emetteurId);
}