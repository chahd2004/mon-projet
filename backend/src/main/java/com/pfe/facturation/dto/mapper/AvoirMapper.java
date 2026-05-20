package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.response.AvoirResponseDTO;
import com.pfe.facturation.dto.response.LigneAvoirResponseDTO;
import com.pfe.facturation.entity.Avoir;
import com.pfe.facturation.entity.LigneAvoir;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class AvoirMapper {

    // convertit une entite Avoir en AvoirResponseDTO
    public AvoirResponseDTO toDTO(Avoir avoir) {
        if (avoir == null) return null;

        AvoirResponseDTO dto = new AvoirResponseDTO();
        dto.setId(avoir.getId());
        dto.setNumAvoir(avoir.getNumAvoir());
        dto.setDateCreation(avoir.getDateCreation());
        dto.setStatut(avoir.getStatut());
        dto.setType(avoir.getType());
        dto.setMotif(avoir.getMotif());
        dto.setTotalHT(avoir.getTotalHT());
        dto.setMontantTVA(avoir.getMontantTVA());
        dto.setTotalTTC(avoir.getTotalTTC());
        dto.setNomVendeur(avoir.getNomVendeur());
        dto.setNomAcheteur(avoir.getNomAcheteur());
        dto.setEmailAcheteur(avoir.getEmailAcheteur());
        dto.setEmailVendeur(avoir.getEmailVendeur());

        // reference vers la facture source
        if (avoir.getFactureSource() != null) {
            dto.setFactureSourceId(avoir.getFactureSource().getId());
            dto.setFactureSourceNum(avoir.getFactureSource().getNumFact());
        }

        // vendeur
        if (avoir.getVendeur() != null) {
            dto.setVendeurId(avoir.getVendeur().getId());
        }

        // acheteur selon son type
        if (avoir.getAcheteurClient() != null) {
            dto.setAcheteurId(avoir.getAcheteurClient().getId());
        } else if (avoir.getAcheteurEmetteur() != null) {
            dto.setAcheteurId(avoir.getAcheteurEmetteur().getId());
        }

        // lignes
        if (avoir.getLignes() != null) {
            dto.setLignes(avoir.getLignes().stream()
                    .map(this::ligneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // convertit une LigneAvoir en DTO
    private LigneAvoirResponseDTO ligneToDTO(LigneAvoir ligne) {
        if (ligne == null) return null;

        LigneAvoirResponseDTO dto = new LigneAvoirResponseDTO();
        dto.setId(ligne.getId());
        dto.setQuantite(ligne.getQuantite());
        dto.setPrixUnitaire(ligne.getPrixUnitaire());
        dto.setMontantHT(ligne.getMontantHT());

        if (ligne.getProduit() != null) {
            dto.setProduitId(ligne.getProduit().getId());
            dto.setProduitDesignation(ligne.getProduit().getDesignation());
        }

        return dto;
    }
}