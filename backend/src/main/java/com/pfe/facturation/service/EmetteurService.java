package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.EmetteurRequestDTO;
import com.pfe.facturation.dto.response.EmetteurResponseDTO;
import java.util.List;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import java.util.Map;
public interface EmetteurService {
    // CRUD
    List<EmetteurResponseDTO> findAll();
    EmetteurResponseDTO findById(Long id);
    EmetteurResponseDTO create(EmetteurRequestDTO dto);
    EmetteurResponseDTO update(Long id, EmetteurRequestDTO dto);
    void delete(Long id);

    // Méthodes spécifiques
    EmetteurResponseDTO findByUserId(Long userId);
    EmetteurResponseDTO updateByUserId(Long userId, EmetteurRequestDTO request);
    Map<String, Object> getEmetteurDashboard(Long userId);
    List<FactureResponseDTO> getFacturesByEmetteur(Long userId);
    List<ProduitResponseDTO> getProduitsByEmetteur(Long emetteurId);
    List<FactureResponseDTO> getAchatsByEmetteur(Long emetteurId);

    // Vérifications
    boolean existsByEmail(String email);
    boolean existsByMatriculeFiscal(String matriculeFiscal);
    boolean existsByCode(String code);
    boolean existsByUserId(Long userId);

    // Compte le nombre total d'émetteurs
    long count();
}