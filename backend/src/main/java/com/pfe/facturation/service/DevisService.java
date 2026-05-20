package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.DevisRequestDTO;
import com.pfe.facturation.dto.response.DevisResponseDTO;
import com.pfe.facturation.entity.User;

import java.util.List;

public interface DevisService {

    // CRUD
    DevisResponseDTO create(DevisRequestDTO dto);
    DevisResponseDTO getById(Long id);
    DevisResponseDTO getByNumDevis(String numDevis);
    List<DevisResponseDTO> getAll();
    DevisResponseDTO update(Long id, DevisRequestDTO dto);
    void delete(Long id);

    // transitions du cycle de vie
    // DRAFT --> SENT
    DevisResponseDTO envoyer(Long id);

    // SENT --> ACCEPTED
    DevisResponseDTO accepter(Long id);

    // SENT --> REJECTED avec raison obligatoire
    DevisResponseDTO rejeter(Long id, String raison);

    // SENT --> EXPIRED
    DevisResponseDTO marquerExpire(Long id);

    // ACCEPTED --> CONVERTED
    // documentRef : reference du document cree (ex: "FACT-2024-0001")
    // appele par les services de conversion dans la Partie 7
    DevisResponseDTO marquerConverti(Long id, String documentRef);

    // recherche
    List<DevisResponseDTO> getByVendeur(Long vendeurId);
    List<DevisResponseDTO> getByAcheteurClient(Long clientId);
    List<DevisResponseDTO> getByAcheteurEmetteur(Long emetteurId);
    List<DevisResponseDTO> getDevisByUser(User user);

    long count();
}