package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.ProduitMapper;
import com.pfe.facturation.dto.request.ProduitRequestDTO;
import com.pfe.facturation.dto.response.ProduitResponseDTO;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.ProduitRepository;
import com.pfe.facturation.service.ProduitService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service Produit.
 */
@Service
@Transactional
public class ProduitServiceImpl implements ProduitService {

    private final ProduitRepository produitRepository;
    private final EmetteurRepository emetteurRepository;
    private final ProduitMapper produitMapper;

    public ProduitServiceImpl(
            ProduitRepository produitRepository,
            EmetteurRepository emetteurRepository,
            ProduitMapper produitMapper) {
        this.produitRepository = produitRepository;
        this.emetteurRepository = emetteurRepository;
        this.produitMapper = produitMapper;
    }

    // ===== CRUD de base =====

    @Override
    public ProduitResponseDTO create(ProduitRequestDTO request) {
        if (request.getEntrepriseId() == null) {
            throw new RuntimeException("L'ID de l'entreprise est obligatoire");
        }

        Emetteur emetteur = emetteurRepository.findById(request.getEntrepriseId())
                .orElseThrow(() -> new ResourceNotFoundException("Entreprise non trouvee avec l'id: " + request.getEntrepriseId()));

        Produit produit = produitMapper.toEntity(request);
        produit.setEmetteur(emetteur);

        Produit savedProduit = produitRepository.save(produit);
        return produitMapper.toResponse(savedProduit);
    }

    @Override
    public List<ProduitResponseDTO> findAll() {
        return produitRepository.findAll()
                .stream()
                .map(produitMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProduitResponseDTO findById(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouvé avec l'id: " + id));
        return produitMapper.toResponse(produit);
    }

    @Override
    public ProduitResponseDTO update(Long id, ProduitRequestDTO request) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouvé avec l'id: " + id));

        produitMapper.updateEntity(produit, request);

        Produit updatedProduit = produitRepository.save(produit);
        return produitMapper.toResponse(updatedProduit);
    }

    @Override
    public void delete(Long id) {
        if (!produitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Produit non trouvé avec l'id: " + id);
        }
        produitRepository.deleteById(id);
    }

    // ===== GESTION DE STOCK =====

    /**
     * Vérifie la disponibilité d'un produit
     */
    @Override
    public boolean checkDisponibilite(Long produitId, int quantite) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouvé: " + produitId));
        return produit.isDisponible(quantite);
    }

    /**
     * Met à jour le stock d'un produit
     */
    @Override
    public ProduitResponseDTO updateStock(Long id, Integer nouvelleQuantite) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouvé: " + id));

        if (nouvelleQuantite < 0) {
            throw new RuntimeException("Le stock ne peut pas être négatif");
        }

        produit.setQuantiteStock(nouvelleQuantite);
        Produit updatedProduit = produitRepository.save(produit);
        return produitMapper.toResponse(updatedProduit);
    }

    /**
     * Liste des produits en stock faible
     */
    @Override
    public List<ProduitResponseDTO> getProduitsStockFaible(Long emetteurId) {
        return produitRepository.findByEmetteurIdAndStockFaible(emetteurId)
                .stream()
                .map(produitMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Liste des produits en rupture de stock
     */
    @Override
    public List<ProduitResponseDTO> getProduitsRuptureStock(Long emetteurId) {
        return produitRepository.findByEmetteurIdAndRuptureStock(emetteurId)
                .stream()
                .map(produitMapper::toResponse)
                .collect(Collectors.toList());
    }

    // ===== MÉTHODES SPÉCIFIQUES =====

    @Override
    public boolean isOwner(Long produitId, Long emetteurId) {
        if (emetteurId == null) return false;

        return produitRepository.findById(produitId)
                .map(produit -> produit.getEmetteur() != null &&
                        produit.getEmetteur().getId().equals(emetteurId))
                .orElse(false);
    }

    @Override
    public List<ProduitResponseDTO> getProduitsByEmetteur(Long emetteurId) {
        if (!emetteurRepository.existsById(emetteurId)) {
            throw new ResourceNotFoundException("Émetteur non trouvé avec l'id: " + emetteurId);
        }

        return produitRepository.findByEmetteurId(emetteurId)
                .stream()
                .map(produitMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long count() {
        return produitRepository.count();
    }

    @Override
    public long countByEmetteurId(Long emetteurId) {
        return produitRepository.countByEmetteurId(emetteurId);
    }
}