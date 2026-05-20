package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.EmetteurDemandeRequest;
import com.pfe.facturation.dto.request.TraiterDemandeRequest;
import com.pfe.facturation.dto.response.DemandeDetailResponse;
import com.pfe.facturation.dto.response.EmetteurDemandeResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface DemandeEmetteurService {
    EmetteurDemandeResponse soumettreDemande(EmetteurDemandeRequest request, HttpServletRequest httpRequest);
    List<DemandeDetailResponse> getAllDemandes();
    List<DemandeDetailResponse> getDemandesEnAttente();
    DemandeDetailResponse getDemandeDetails(Long id);
    void approuverDemande(Long id, TraiterDemandeRequest request);
    void rejeterDemande(Long id, TraiterDemandeRequest request);
    String verifierStatutDemande(String email);
    boolean existsByEmail(String email);
}