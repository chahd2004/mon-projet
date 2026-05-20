package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.CommandeRequestDTO;
import com.pfe.facturation.dto.response.CommandeResponseDTO;
import com.pfe.facturation.entity.User;

import java.util.List;

public interface CommandeService {

    // CRUD
    CommandeResponseDTO create(CommandeRequestDTO dto);
    CommandeResponseDTO getById(Long id);
    List<CommandeResponseDTO> getAll();
    CommandeResponseDTO update(Long id, CommandeRequestDTO dto);
    void delete(Long id);

    // transitions du cycle de vie

    // DRAFT --> CONFIRMED
    CommandeResponseDTO confirmer(Long id);

    // CONFIRMED --> IN_PROGRESS
    CommandeResponseDTO demarrer(Long id);

    // IN_PROGRESS --> DELIVERED
    CommandeResponseDTO marquerLivree(Long id);

    // DELIVERED --> CLOSED
    // documentRef : reference de la facture ou du BL cree
    // appele par ConversionService dans la Partie 7
    CommandeResponseDTO cloturer(Long id, String documentRef);

    // IN_PROGRESS --> CANCELLED
    CommandeResponseDTO annuler(Long id, String raison);

    // recherche
    List<CommandeResponseDTO> getByVendeur(Long vendeurId);
    List<CommandeResponseDTO> getByAcheteurClient(Long clientId);
    List<CommandeResponseDTO> getByAcheteurEmetteur(Long emetteurId);
    List<CommandeResponseDTO> getCommandesByUser(User user);

    long count();
}