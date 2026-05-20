package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.FactureRequestDTO;
import com.pfe.facturation.dto.request.LigneFactureRequestDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.enums.EntityType;
import org.springframework.stereotype.Component;
import java.util.stream.Collectors;

@Component
public class FactureMapper {

    private final LigneFactureMapper ligneFactureMapper;

    public FactureMapper(LigneFactureMapper ligneFactureMapper) {
        this.ligneFactureMapper = ligneFactureMapper;
    }

    /**
     * Convertit une entité Facture en FactureResponseDTO
     */
    public FactureResponseDTO toDTO(Facture facture) {
        if (facture == null)
            return null;

        FactureResponseDTO dto = new FactureResponseDTO();
        dto.setId(facture.getId());
        dto.setNumFact(facture.getNumFact());
        dto.setDateEmission(facture.getDateEmission());
        dto.setDatePaiement(facture.getDatePaiement());

        // Infos acheteur avec EntityType
        if (facture.isAcheteurClient()) {
            dto.setAcheteurId(facture.getAcheteurClient().getId());
            dto.setAcheteurNom(facture.getNomAcheteur());
            dto.setTypeAcheteur(EntityType.CLIENT); // ← EntityType.CLIENT
        } else if (facture.isAcheteurEmetteur()) {
            dto.setAcheteurId(facture.getAcheteurEmetteur().getId());
            dto.setAcheteurNom(facture.getNomAcheteur());
            dto.setTypeAcheteur(EntityType.EMETTEUR); // ← EntityType.EMETTEUR
        }

        // Infos vendeur
        if (facture.getVendeur() != null) {
            dto.setVendeurId(facture.getVendeur().getId());
            dto.setVendeurNom(facture.getNomVendeur());
            dto.setTypeVendeur(EntityType.EMETTEUR); // ← EntityType.EMETTEUR
        }

        dto.setModePaiement(facture.getModePaiement());
        dto.setStatut(facture.getStatut());
        dto.setPreviousStatut(facture.getPreviousStatut());
        dto.setRejectionReason(facture.getRejectionReason());
        dto.setSourceDocumentRef(facture.getSourceDocumentRef());
        dto.setTotalHT(facture.getTotalHT());
        dto.setMontantTVA(facture.getMontantTVA());
        dto.setTotalTTC(facture.getTotalTTC());
        dto.setMontantEnLettres(facture.getMontantEnLettres());
        // inclure le XML genere dans la reponse si present
        dto.setXmlContent(facture.getXmlContent());

        if (facture.getLignes() != null) {
            dto.setLignes(facture.getLignes()
                    .stream()
                    .map(ligneFactureMapper::toDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * Convertit un FactureRequestDTO en entité Facture
     */
    public Facture toEntity(FactureRequestDTO dto) {
        if (dto == null)
            return null;

        Facture facture = new Facture();
        facture.setDateEmission(dto.getDateEmission());
        facture.setDatePaiement(dto.getDatePaiement());
        facture.setModePaiement(dto.getModePaiement());
        facture.setStatut(dto.getStatut());

        if (dto.getLignes() != null) {
            facture.setLignes(dto.getLignes()
                    .stream()
                    .map(this::mapLigneToEntity)
                    .collect(Collectors.toList()));
        }
        return facture;
    }

    /**
     * Convertit une LigneFactureRequestDTO en entité LigneFacture
     */
    public LigneFacture mapLigneToEntity(LigneFactureRequestDTO ligneDTO) {
        if (ligneDTO == null)
            return null;

        LigneFacture ligne = new LigneFacture();
        ligne.setQuantite(ligneDTO.getQuantite());

        Produit produit = new Produit();
        produit.setId(ligneDTO.getProduitId());
        ligne.setProduit(produit);

        return ligne;
    }
}