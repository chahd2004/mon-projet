package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.EmetteurMapper;
import com.pfe.facturation.dto.mapper.FactureMapper;
import com.pfe.facturation.dto.mapper.ProduitMapper;
import com.pfe.facturation.dto.request.EmetteurRequestDTO;
import com.pfe.facturation.dto.response.EmetteurResponseDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.repository.ProduitRepository;
import com.pfe.facturation.repository.UserRepository;
import com.pfe.facturation.service.EmetteurService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implémentation du service de gestion des émetteurs (Entreprises).
 * Aligné sur le système à 3 rôles.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class EmetteurServiceImpl implements EmetteurService {

    private final EmetteurRepository emetteurRepository;
    private final UserRepository userRepository;
    private final FactureRepository factureRepository;
    private final ProduitRepository produitRepository;
    private final EmetteurMapper emetteurMapper;
    private final FactureMapper factureMapper;
    private final ProduitMapper produitMapper;

    @Override
    public EmetteurResponseDTO create(EmetteurRequestDTO request) {
        if (emetteurRepository.existsByMatriculeFiscal(request.getMatriculeFiscal())) {
            throw new RuntimeException("Matricule fiscal déjà existant");
        }
        if (emetteurRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Code déjà existant");
        }
        if (emetteurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        Emetteur emetteur = emetteurMapper.toEntity(request);
        
        // Un émetteur n'est plus forcément lié à un seul utilisateur "owner" (Legacy)
        // Mais on garde la structure si nécessaire pour la transition
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            emetteur.setUser(user);
        }

        Emetteur savedEmetteur = emetteurRepository.save(emetteur);
        return emetteurMapper.toResponse(savedEmetteur);
    }

    @Override
    public List<EmetteurResponseDTO> findAll() {
        return emetteurRepository.findAll().stream()
                .map(emetteurMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public EmetteurResponseDTO findById(Long id) {
        Emetteur emetteur = emetteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée avec l'id: " + id));
        return emetteurMapper.toResponse(emetteur);
    }

    @Override
    public EmetteurResponseDTO update(Long id, EmetteurRequestDTO request) {
        Emetteur emetteur = emetteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvée avec l'id: " + id));

        emetteurMapper.updateEntity(emetteur, request);
        return emetteurMapper.toResponse(emetteurRepository.save(emetteur));
    }

    @Override
    public void delete(Long id) {
        if (!emetteurRepository.existsById(id)) {
            throw new ResourceNotFoundException("Entreprise non trouvée avec l'id: " + id);
        }
        emetteurRepository.deleteById(id);
    }

    @Override
    public EmetteurResponseDTO findByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        
        if (user.getEntreprise() != null) {
            return emetteurMapper.toResponse(user.getEntreprise());
        }
        
        // Fallback pour anciens comptes
        Emetteur emetteur = emetteurRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune entreprise trouvée pour cet utilisateur"));
        
        return emetteurMapper.toResponse(emetteur);
    }

    @Override
    public EmetteurResponseDTO updateByUserId(Long userId, EmetteurRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        
        Emetteur emetteur;
        if (user.getEntreprise() != null) {
            emetteur = user.getEntreprise();
        } else {
            emetteur = emetteurRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Aucune entreprise trouvée"));
        }

        emetteurMapper.updateEntityWithoutEmail(emetteur, request);
        return emetteurMapper.toResponse(emetteurRepository.save(emetteur));
    }

    @Override
    public Map<String, Object> getEmetteurDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        
        Emetteur emetteur = user.getEntreprise();
        if (emetteur == null) {
            throw new ResourceNotFoundException("Utilisateur non lié à une entreprise");
        }

        List<Facture> ventes = factureRepository.findByVendeurId(emetteur.getId());
        List<Facture> achats = factureRepository.findByAcheteurEmetteurId(emetteur.getId());
        List<Produit> produits = produitRepository.findByEmetteurId(emetteur.getId());

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("emetteurId", emetteur.getId());
        dashboard.put("raisonSociale", emetteur.getRaisonSociale());
        dashboard.put("totalVentes", ventes.size());
        dashboard.put("totalAchats", achats.size());
        dashboard.put("totalProduits", produits.size());

        double ca = ventes.stream().mapToDouble(f -> f.getTotalTTC() != null ? f.getTotalTTC().doubleValue() : 0).sum();
        dashboard.put("chiffreAffaires", ca);

        return dashboard;
    }

    @Override
    public List<FactureResponseDTO> getFacturesByEmetteur(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        
        if (user.getEntreprise() == null) {
            throw new RuntimeException("Aucun émetteur associé");
        }

        return factureRepository.findByVendeurId(user.getEntreprise().getId()).stream()
                .map(factureMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProduitResponseDTO> getProduitsByEmetteur(Long emetteurId) {
        return produitRepository.findByEmetteurId(emetteurId).stream()
                .map(produitMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FactureResponseDTO> getAchatsByEmetteur(Long emetteurId) {
        return factureRepository.findByAcheteurEmetteurId(emetteurId).stream()
                .map(factureMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override public boolean existsByEmail(String email) { return emetteurRepository.existsByEmail(email); }
    @Override public boolean existsByMatriculeFiscal(String mf) { return emetteurRepository.existsByMatriculeFiscal(mf); }
    @Override public boolean existsByCode(String code) { return emetteurRepository.existsByCode(code); }
    @Override public boolean existsByUserId(Long userId) { return emetteurRepository.existsByUserId(userId); }
    @Override public long count() { return emetteurRepository.count(); }
}