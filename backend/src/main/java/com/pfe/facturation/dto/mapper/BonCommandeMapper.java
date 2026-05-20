package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.BonCommandeRequestDTO;
import com.pfe.facturation.dto.request.LigneBonCommandeRequestDTO;
import com.pfe.facturation.dto.response.BonCommandeResponseDTO;
import com.pfe.facturation.dto.response.LigneBonCommandeResponseDTO;
import com.pfe.facturation.entity.BonCommande;
import com.pfe.facturation.entity.LigneBonCommande;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.enums.EntityType;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class BonCommandeMapper {

    // convertit une entite BonCommande en BonCommandeResponseDTO
    public BonCommandeResponseDTO toDTO(BonCommande bc) {
        if (bc == null)
            return null;

        BonCommandeResponseDTO dto = new BonCommandeResponseDTO();
        dto.setId(bc.getId());
        dto.setNumBonCommande(bc.getNumBonCommande());
        dto.setDateCreation(bc.getDateCreation());
        dto.setStatut(bc.getStatut());
        dto.setModePaiement(bc.getModePaiement());
        dto.setCancellationReason(bc.getCancellationReason());
        dto.setDevisSourceRef(bc.getDevisSourceRef());
        dto.setDocumentConvertiRef(bc.getDocumentConvertiRef());
        dto.setTotalHT(bc.getTotalHT());
        dto.setMontantTVA(bc.getMontantTVA());
        dto.setTotalTTC(bc.getTotalTTC());
        dto.setMontantEnLettres(bc.getMontantEnLettres());
        dto.setVendeurNom(bc.getNomVendeur());
        dto.setAcheteurNom(bc.getNomAcheteur());

        // acheteur selon son type
        if (bc.isAcheteurClient()) {
            dto.setAcheteurId(bc.getAcheteurClient().getId());
            dto.setTypeAcheteur(EntityType.CLIENT);
        } else if (bc.isAcheteurEmetteur()) {
            dto.setAcheteurId(bc.getAcheteurEmetteur().getId());
            dto.setTypeAcheteur(EntityType.EMETTEUR);
        }

        // vendeur
        if (bc.getVendeur() != null) {
            dto.setVendeurId(bc.getVendeur().getId());
        }

        // lignes
        if (bc.getLignes() != null) {
            dto.setLignes(bc.getLignes().stream()
                    .map(this::ligneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // convertit un BonCommandeRequestDTO en entite BonCommande
    public BonCommande toEntity(BonCommandeRequestDTO dto) {
        if (dto == null)
            return null;

        BonCommande bc = new BonCommande();
        bc.setDateCreation(dto.getDateCreation());
        bc.setModePaiement(dto.getModePaiement());
        bc.setDevisSourceRef(dto.getDevisSourceRef());

        if (dto.getLignes() != null) {
            bc.setLignes(dto.getLignes().stream()
                    .map(this::ligneToEntity)
                    .collect(Collectors.toList()));
        }

        return bc;
    }

    // convertit une LigneBonCommande en DTO
    private LigneBonCommandeResponseDTO ligneToDTO(LigneBonCommande ligne) {
        if (ligne == null)
            return null;

        LigneBonCommandeResponseDTO dto = new LigneBonCommandeResponseDTO();
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

    // convertit une LigneBonCommandeRequestDTO en entite
    private LigneBonCommande ligneToEntity(LigneBonCommandeRequestDTO ligneDto) {
        if (ligneDto == null)
            return null;

        LigneBonCommande ligne = new LigneBonCommande();
        ligne.setQuantite(ligneDto.getQuantite());

        // seul l'id est connu ici, le produit complet est charge dans le service
        Produit produit = new Produit();
        produit.setId(ligneDto.getProduitId());
        ligne.setProduit(produit);

        return ligne;
    }
}