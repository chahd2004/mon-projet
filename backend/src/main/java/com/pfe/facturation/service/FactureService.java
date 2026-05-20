package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.FactureRequestDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.entity.User;

import java.util.List;

public interface FactureService {

    // CRUD de base
    FactureResponseDTO create(FactureRequestDTO dto);
    List<FactureResponseDTO> getAll();
    FactureResponseDTO getById(Long id);
    FactureResponseDTO update(Long id, FactureRequestDTO dto);
    void delete(Long id);

    // verification du stock avant creation
    void verifierStockAvantFacture(FactureRequestDTO dto);

    // transitions du cycle de vie
    // DRAFT --> SIGNED
    FactureResponseDTO signer(Long id);

    // SIGNED --> SENT
    FactureResponseDTO envoyer(Long id);

    // SENT --> PAID
    FactureResponseDTO marquerPayee(Long id);

    // SIGNED/SENT --> REJECTED avec raison obligatoire
    // si previousStatut = SIGNED, peut revenir en DRAFT via retourEnBrouillon
    FactureResponseDTO rejeter(Long id, String raison);

    // REJECTED --> DRAFT (uniquement si rejet vient de SIGNED)
    FactureResponseDTO retourEnBrouillon(Long id);

    // SIGNED/SENT --> CANCELLED, cree un Avoir automatiquement
    FactureResponseDTO annuler(Long id);

    // recherche
    boolean isConcerned(Long factureId, User user);
    List<FactureResponseDTO> getFacturesByAcheteurClient(Long clientId);
    List<FactureResponseDTO> getFacturesByAcheteurEmetteur(Long emetteurId);
    List<FactureResponseDTO> getFacturesByVendeur(Long emetteurId);
    List<FactureResponseDTO> getFacturesForCurrentUser(User user);

    // genere le XML depuis les donnees de la facture et le stocke en base
    // appele automatiquement lors du passage en statut SIGNED
    FactureResponseDTO genererXml(Long id);

    // retourne le contenu XML stocke d'une facture
    // utilise par le endpoint GET /api/factures/{id}/xml
    String getXml(Long id);

    long count();
}