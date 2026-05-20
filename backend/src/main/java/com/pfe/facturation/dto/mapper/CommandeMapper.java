package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.CommandeRequestDTO;
import com.pfe.facturation.dto.request.LigneCommandeRequestDTO;
import com.pfe.facturation.dto.response.CommandeResponseDTO;
import com.pfe.facturation.dto.response.LigneCommandeResponseDTO;
import com.pfe.facturation.entity.Commande;
import com.pfe.facturation.entity.LigneCommande;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.enums.EntityType;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class CommandeMapper {

    // convertit une entite Commande en CommandeResponseDTO
    public CommandeResponseDTO toDTO(Commande commande) {
        if (commande == null) return null;

        CommandeResponseDTO dto = new CommandeResponseDTO();
        dto.setId(commande.getId());
        dto.setNumCommande(commande.getNumCommande());
        dto.setDateCreation(commande.getDateCreation());
        dto.setStatut(commande.getStatut());
        dto.setModePaiement(commande.getModePaiement());
        dto.setNotes(commande.getNotes());
        dto.setCancellationReason(commande.getCancellationReason());
        dto.setSourceDocumentRef(commande.getSourceDocumentRef());
        dto.setDocumentConvertiRef(commande.getDocumentConvertiRef());
        dto.setTotalHT(commande.getTotalHT());
        dto.setMontantTVA(commande.getMontantTVA());
        dto.setTotalTTC(commande.getTotalTTC());
        dto.setMontantEnLettres(commande.getMontantEnLettres());
        dto.setVendeurNom(commande.getNomVendeur());
        dto.setAcheteurNom(commande.getNomAcheteur());

        // acheteur selon son type
        if (commande.isAcheteurClient()) {
            dto.setAcheteurId(commande.getAcheteurClient().getId());
            dto.setTypeAcheteur(EntityType.CLIENT);
        } else if (commande.isAcheteurEmetteur()) {
            dto.setAcheteurId(commande.getAcheteurEmetteur().getId());
            dto.setTypeAcheteur(EntityType.EMETTEUR);
        }

        // vendeur
        if (commande.getVendeur() != null) {
            dto.setVendeurId(commande.getVendeur().getId());
        }

        // lignes
        if (commande.getLignes() != null) {
            dto.setLignes(commande.getLignes().stream()
                    .map(this::ligneToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // convertit un CommandeRequestDTO en entite Commande
    public Commande toEntity(CommandeRequestDTO dto) {
        if (dto == null) return null;

        Commande commande = new Commande();
        commande.setDateCreation(dto.getDateCreation());
        commande.setModePaiement(dto.getModePaiement());
        commande.setNotes(dto.getNotes());
        commande.setSourceDocumentRef(dto.getSourceDocumentRef());

        if (dto.getLignes() != null) {
            commande.setLignes(dto.getLignes().stream()
                    .map(this::ligneToEntity)
                    .collect(Collectors.toList()));
        }

        return commande;
    }

    // convertit une LigneCommande en DTO
    private LigneCommandeResponseDTO ligneToDTO(LigneCommande ligne) {
        if (ligne == null) return null;

        LigneCommandeResponseDTO dto = new LigneCommandeResponseDTO();
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

    // convertit une LigneCommandeRequestDTO en entite
    private LigneCommande ligneToEntity(LigneCommandeRequestDTO ligneDto) {
        if (ligneDto == null) return null;

        LigneCommande ligne = new LigneCommande();
        ligne.setQuantite(ligneDto.getQuantite());

        // seul l'id est connu ici, le produit complet est charge dans le service
        Produit produit = new Produit();
        produit.setId(ligneDto.getProduitId());
        ligne.setProduit(produit);

        return ligne;
    }
}