package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.LigneFactureRequestDTO;
import com.pfe.facturation.dto.response.LigneFactureResponseDTO;
import com.pfe.facturation.entity.LigneFacture;
import com.pfe.facturation.entity.Produit;
import org.springframework.stereotype.Component;

@Component
public class LigneFactureMapper {

    public LigneFactureResponseDTO toDTO(LigneFacture ligne) {
        if (ligne == null) return null;

        LigneFactureResponseDTO dto = new LigneFactureResponseDTO();
        dto.setId(ligne.getId());
        dto.setQuantite(ligne.getQuantite());

        //les infos produit nécessaires
        if (ligne.getProduit() != null) {
            dto.setProduitId(ligne.getProduit().getId());
            dto.setProduitDesignation(ligne.getProduit().getDesignation());
        }

        return dto;
    }
    public LigneFacture toEntity(LigneFactureRequestDTO dto) {
        if (dto == null) return null;

        LigneFacture ligne = new LigneFacture();
        ligne.setQuantite(dto.getQuantite());

        Produit produit = new Produit();
        produit.setId(dto.getProduitId());
        ligne.setProduit(produit);

        return ligne;
    }
}