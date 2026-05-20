package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.ProduitRequestDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.entity.Emetteur;
import org.springframework.stereotype.Component;

/**
 * Mapper pour convertir DTO <-> Entity
 */
@Component
public class ProduitMapper {

    /**
     * Convertir RequestDTO vers Entity (sans émetteur)
     */
    public Produit toEntity(ProduitRequestDTO dto) {
        if (dto == null) return null;

        Produit produit = new Produit();
        produit.setReference(dto.getReference());
        produit.setDesignation(dto.getDesignation());
        produit.setPrixUnitaire(dto.getPrixUnitaire());
        produit.setTauxTVA(dto.getTauxTVA());

        // ========== GESTION DE STOCK ==========
        produit.setQuantiteStock(dto.getQuantiteStock() != null ? dto.getQuantiteStock() : 0);
        produit.setStockIllimite(dto.isStockIllimite());
        produit.setSeuilAlerteStock(dto.getSeuilAlerteStock() != null ? dto.getSeuilAlerteStock() : 5);

        return produit;
    }

    /**
     * Convertir RequestDTO vers Entity avec émetteur (création)
     */
    public Produit toEntityWithEmetteur(ProduitRequestDTO dto, Emetteur emetteur) {
        Produit produit = toEntity(dto);
        if (produit != null && emetteur != null) {
            produit.setEmetteur(emetteur);
        }
        return produit;
    }

    /**
     * Mettre à jour une entité existante
     */
    public void updateEntity(Produit produit, ProduitRequestDTO dto) {
        if (dto == null || produit == null) return;

        produit.setReference(dto.getReference());
        produit.setDesignation(dto.getDesignation());
        produit.setPrixUnitaire(dto.getPrixUnitaire());
        produit.setTauxTVA(dto.getTauxTVA());

        // ========== GESTION DE STOCK ==========
        if (dto.getQuantiteStock() != null) {
            produit.setQuantiteStock(dto.getQuantiteStock());
        }
        produit.setStockIllimite(dto.isStockIllimite());
        if (dto.getSeuilAlerteStock() != null) {
            produit.setSeuilAlerteStock(dto.getSeuilAlerteStock());
        }
        // Ne pas modifier l'émetteur !
    }

    /**
     * Convertir Entity vers ResponseDTO
     */
    public ProduitResponseDTO toResponse(Produit produit) {
        if (produit == null) return null;

        ProduitResponseDTO dto = new ProduitResponseDTO();
        dto.setId(produit.getId());
        dto.setReference(produit.getReference());
        dto.setDesignation(produit.getDesignation());
        dto.setPrixUnitaire(produit.getPrixUnitaire());
        dto.setTauxTVA(produit.getTauxTVA());

        // ========== GESTION DE STOCK ==========
        dto.setQuantiteStock(produit.getQuantiteStock());
        dto.setStockIllimite(produit.isStockIllimite());
        dto.setSeuilAlerteStock(produit.getSeuilAlerteStock());
        dto.setDisponible(produit.isDisponible(1)); // Disponible pour au moins 1 unité
        dto.setStockFaible(produit.isStockFaible());
        dto.setRuptureStock(produit.isRuptureStock());

        // Ajouter les infos de l'entreprise
        if (produit.getEmetteur() != null) {
            dto.setEntrepriseId(produit.getEmetteur().getId());
            dto.setEntrepriseRaisonSociale(produit.getEmetteur().getRaisonSociale());
        }

        return dto;
    }
}