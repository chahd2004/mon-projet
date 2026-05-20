package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.BonLivraisonRequestDTO;
import com.pfe.facturation.dto.response.BonLivraisonResponseDTO;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.dto.request.SignatureRequestDTO;

import java.util.List;

public interface BonLivraisonService {

    // CRUD
    BonLivraisonResponseDTO create(BonLivraisonRequestDTO dto);
    BonLivraisonResponseDTO getById(Long id);
    BonLivraisonResponseDTO getByNumBonLivraison(String numBonLivraison);
    List<BonLivraisonResponseDTO> getAll();
    void delete(Long id);

    // transitions du cycle de vie

    // DRAFT --> DELIVERED
    BonLivraisonResponseDTO marquerLivre(Long id);

    // DELIVERED --> SIGNED_CLIENT
    BonLivraisonResponseDTO signerParClient(SignatureRequestDTO request);

    String genererXml(Long id) throws Exception;
    BonLivraisonResponseDTO sauvegarderXmlSigne(Long id, String xmlSigne);

    // DELIVERED --> DISPUTE
    BonLivraisonResponseDTO signalerLitige(Long id, String motif);

    // DISPUTE --> SIGNED_CLIENT
    BonLivraisonResponseDTO resoudreLitige(Long id);

    // SIGNED_CLIENT --> CLOSED
    BonLivraisonResponseDTO cloturer(Long id, String factureRef);

    // DRAFT, DELIVERED, DISPUTE or SIGNED_CLIENT --> CANCELLED
    BonLivraisonResponseDTO annuler(Long id, String raison);

    // recherche
    List<BonLivraisonResponseDTO> getByVendeur(Long vendeurId);
    List<BonLivraisonResponseDTO> getByAcheteurClient(Long clientId);
    List<BonLivraisonResponseDTO> getByAcheteurEmetteur(Long emetteurId);
    List<BonLivraisonResponseDTO> getBonLivraisonsByUser(User user);

    long count();
}