package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.ClientRequestDTO;
import com.pfe.facturation.dto.response.ClientResponseDTO;
import java.util.List;

public interface ClientService {
    List<ClientResponseDTO> findAll();
    ClientResponseDTO findById(Long id);
    ClientResponseDTO create(ClientRequestDTO dto);
    ClientResponseDTO update(Long id, ClientRequestDTO dto);
    void delete(Long id);

    ClientResponseDTO findByUserId(Long userId);
    ClientResponseDTO updateByUserId(Long userId, ClientRequestDTO request);
    boolean existsByEmail(String email);
    boolean existsByUserId(Long userId);
    long count();
    List<ClientResponseDTO> getClientsByEmetteur(Long emetteurId);

    // ← NOUVELLES
    List<ClientResponseDTO> findByEmetteurUserId(Long userId);
    void checkEmetteurOwnership(Long userId, Long clientId);
}