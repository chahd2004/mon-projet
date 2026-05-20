package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.DevisRequestDTO;
import com.pfe.facturation.dto.request.LigneDevisRequestDTO;
import com.pfe.facturation.dto.response.DevisResponseDTO;
import com.pfe.facturation.dto.response.LigneDevisResponseDTO;
import com.pfe.facturation.entity.Devis;
import com.pfe.facturation.entity.LigneDevis;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.enums.EntityType;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class DevisMapper {

    // convertit une entite Devis en DevisResponseDTO
    public DevisResponseDTO toDTO(Devis devis) {
        if (devis == null) return null;

        DevisResponseDTO dto = new DevisResponseDTO();
        dto.setId(devis.getId());
        dto.setNumDevis(devis.getNumDevis());
        dto.setDateCreation(devis.getDateCreation());
        dto.setDateValidite(devis.getDateValidite());
        dto.setStatut(devis.getStatut());
        dto.setNotes(devis.getNotes());
        dto.setRejectionReason(devis.getRejectionReason());
        dto.setDocumentConvertiRef(devis.getDocumentConvertiRef());
        dto.setTotalHT(devis.getTotalHT());
        dto.setMontantTVA(devis.getMontantTVA());
        dto.setTotalTTC(devis.getTotalTTC());
        dto.setMontantEnLettres(devis.getMontantEnLettres());
        dto.setVendeurNom(devis.getNomVendeur());

        // acheteur selon son type
        if (devis.isAcheteurClient()) {
            dto.setAcheteurId(devis.getAcheteurClient().getId());
            dto.setAcheteurNom(devis.getNomAcheteur());
            dto.setTypeAcheteur(EntityType.CLIENT);
        } else if (devis.isAcheteurEmetteur()) {
            dto.setAcheteurId(devis.getAcheteurEmetteur().getId());
            dto.setAcheteurNom(devis.getNomAcheteur());
            dto.setTypeAcheteur(EntityType.EMETTEUR);
        }

        // vendeur
        if (devis.getVendeur() != null) {
            dto.setVendeurId(devis.getVendeur().getId());
        }

        // lignes
        if (devis.getLignes() != null) {
            dto.setLignes(devis.getLignes().stream()
                    .map(this::ligneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // convertit un DevisRequestDTO en entite Devis (sans acheteur ni vendeur)
    // l'acheteur et le vendeur sont charges dans le service
    public Devis toEntity(DevisRequestDTO dto) {
        if (dto == null) return null;

        Devis devis = new Devis();
        devis.setDateCreation(dto.getDateCreation());
        devis.setDateValidite(dto.getDateValidite());
        devis.setNotes(dto.getNotes());

        if (dto.getLignes() != null) {
            devis.setLignes(dto.getLignes().stream()
                    .map(this::ligneToEntity)
                    .collect(Collectors.toList()));
        }

        return devis;
    }

    // convertit une LigneDevis en DTO
    private LigneDevisResponseDTO ligneToDTO(LigneDevis ligne) {
        if (ligne == null) return null;

        LigneDevisResponseDTO dto = new LigneDevisResponseDTO();
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

    // convertit une LigneDevisRequestDTO en entite LigneDevis
    private LigneDevis ligneToEntity(LigneDevisRequestDTO ligneDto) {
        if (ligneDto == null) return null;

        LigneDevis ligne = new LigneDevis();
        ligne.setQuantite(ligneDto.getQuantite());

        // seul l'id est connu ici, le produit complet est charge dans le service
        Produit produit = new Produit();
        produit.setId(ligneDto.getProduitId());
        ligne.setProduit(produit);

        return ligne;
    }
}