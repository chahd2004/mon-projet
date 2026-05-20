package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.BonLivraisonRequestDTO;
import com.pfe.facturation.dto.request.LigneBonLivraisonRequestDTO;
import com.pfe.facturation.dto.response.BonLivraisonResponseDTO;
import com.pfe.facturation.dto.response.LigneBonLivraisonResponseDTO;
import com.pfe.facturation.entity.BonLivraison;
import com.pfe.facturation.entity.LigneBonLivraison;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.enums.EntityType;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class BonLivraisonMapper {

    // convertit une entite BonLivraison en BonLivraisonResponseDTO
    public BonLivraisonResponseDTO toDTO(BonLivraison bl) {
        if (bl == null) return null;

        BonLivraisonResponseDTO dto = new BonLivraisonResponseDTO();
        dto.setId(bl.getId());
        dto.setNumBonLivraison(bl.getNumBonLivraison());
        dto.setDateCreation(bl.getDateCreation());
        dto.setDateLivraison(bl.getDateLivraison());
        dto.setStatut(bl.getStatut());
        dto.setDisputeReason(bl.getDisputeReason());
        dto.setCommandeSourceRef(bl.getCommandeSourceRef());
        dto.setFactureRef(bl.getFactureRef());
        dto.setAdresseLivraison(bl.getAdresseLivraison());
        dto.setAcheteurNom(bl.getNomAcheteur());
        dto.setVendeurNom(bl.getNomVendeur());

        // acheteur selon son type
        if (bl.isAcheteurClient()) {
            dto.setAcheteurId(bl.getAcheteurClient().getId());
            dto.setTypeAcheteur(EntityType.CLIENT);
        } else if (bl.isAcheteurEmetteur()) {
            dto.setAcheteurId(bl.getAcheteurEmetteur().getId());
            dto.setTypeAcheteur(EntityType.EMETTEUR);
        }

        // vendeur
        if (bl.getVendeur() != null) {
            dto.setVendeurId(bl.getVendeur().getId());
        }

        // lignes
        if (bl.getLignes() != null) {
            dto.setLignes(bl.getLignes().stream()
                    .map(this::ligneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // convertit un BonLivraisonRequestDTO en entite BonLivraison
    public BonLivraison toEntity(BonLivraisonRequestDTO dto) {
        if (dto == null) return null;

        BonLivraison bl = new BonLivraison();
        bl.setDateCreation(dto.getDateCreation());
        bl.setCommandeSourceRef(dto.getCommandeSourceRef());

        if (dto.getLignes() != null) {
            bl.setLignes(dto.getLignes().stream()
                    .map(this::ligneToEntity)
                    .collect(Collectors.toList()));
        }

        return bl;
    }

    // convertit une LigneBonLivraison en DTO
    private LigneBonLivraisonResponseDTO ligneToDTO(LigneBonLivraison ligne) {
        if (ligne == null) return null;

        LigneBonLivraisonResponseDTO dto = new LigneBonLivraisonResponseDTO();
        dto.setId(ligne.getId());
        dto.setQuantite(ligne.getQuantite());

        if (ligne.getProduit() != null) {
            dto.setProduitId(ligne.getProduit().getId());
            dto.setProduitDesignation(ligne.getProduit().getDesignation());
        }

        return dto;
    }

    // convertit une LigneBonLivraisonRequestDTO en entite
    private LigneBonLivraison ligneToEntity(LigneBonLivraisonRequestDTO ligneDto) {
        if (ligneDto == null) return null;

        LigneBonLivraison ligne = new LigneBonLivraison();
        ligne.setQuantite(ligneDto.getQuantite());

        // seul l'id est connu ici, le produit complet est charge dans le service
        Produit produit = new Produit();
        produit.setId(ligneDto.getProduitId());
        ligne.setProduit(produit);

        return ligne;
    }
}