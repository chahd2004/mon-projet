package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.AvoirRequestDTO;
import com.pfe.facturation.dto.response.AvoirResponseDTO;
import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.entity.User;
import java.util.Map;
import java.util.List;

public interface AvoirService {

    // cree automatiquement un avoir DRAFT depuis une facture CANCELLED
    // appele par FactureServiceImpl.annuler()
    AvoirResponseDTO creerDepuisFacture(Facture facture);

    /**
     * Creation manuelle d'un avoir (Triggers creation and potentially status updates)
     */
    AvoirResponseDTO create(AvoirRequestDTO dto);

    /**
     * Trigger pour creer un avoir depuis une facture annulee (Wrapper pour l'API)
     */
    AvoirResponseDTO createFromCancelledFacture(Long factureId);

    /**
     * Suppression d'un avoir (Uniquement DRAFT)
     */
    void delete(Long id);

    /**
     * Statistiques globales des avoirs
     */
    Map<String, Object> getStatistiques(User user);

    // transitions du cycle de vie
    // DRAFT --> VALIDATED
    AvoirResponseDTO valider(Long id);

    // VALIDATED --> SENT
    AvoirResponseDTO envoyer(Long id);

    // SENT --> APPLIED
    AvoirResponseDTO appliquer(Long id);

    // lecture
    AvoirResponseDTO getById(Long id);
    List<AvoirResponseDTO> getAll();
    List<AvoirResponseDTO> getByFacture(Long factureId);
    List<AvoirResponseDTO> getByVendeur(Long vendeurId);

    // mise a jour (uniquement en DRAFT, pour ajuster les lignes en cas partiel)
    AvoirResponseDTO update(Long id, AvoirRequestDTO dto);
}