package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.BonCommandeRequestDTO;
import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.BonCommandeResponseDTO;
import com.pfe.facturation.entity.User;

import java.util.List;

public interface BonCommandeService {

    // CRUD
    BonCommandeResponseDTO create(BonCommandeRequestDTO dto);
    BonCommandeResponseDTO getById(Long id);
    BonCommandeResponseDTO getByNumBonCommande(String numBonCommande);
    List<BonCommandeResponseDTO> getAll();
    BonCommandeResponseDTO update(Long id, BonCommandeRequestDTO dto);
    void delete(Long id);

    // transitions du cycle de vie
    BonCommandeResponseDTO envoyer(Long id);

    BonCommandeResponseDTO signerParClient(SignatureRequestDTO request);

    String genererXml(Long id) throws Exception;
    BonCommandeResponseDTO sauvegarderXmlSigne(Long id, String xmlSigne);

    // SIGNED_CLIENT --> CONFIRMED
    BonCommandeResponseDTO confirmer(Long id);

    // SENT ou SIGNED_CLIENT --> CANCELLED
    BonCommandeResponseDTO annuler(Long id, String raison);

    // CONFIRMED --> CONVERTED
    BonCommandeResponseDTO marquerConverti(Long id, String documentRef);

    // recherche
    List<BonCommandeResponseDTO> getByVendeur(Long vendeurId);
    List<BonCommandeResponseDTO> getByAcheteurClient(Long clientId);
    List<BonCommandeResponseDTO> getByAcheteurEmetteur(Long emetteurId);
    List<BonCommandeResponseDTO> getBonCommandesByUser(User user);

    long count();
}