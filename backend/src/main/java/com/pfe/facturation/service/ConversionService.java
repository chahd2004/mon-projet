package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.ConversionRequestDTO;
import com.pfe.facturation.dto.response.BonCommandeResponseDTO;
import com.pfe.facturation.dto.response.BonLivraisonResponseDTO;
import com.pfe.facturation.dto.response.CommandeResponseDTO;
import com.pfe.facturation.dto.response.FactureResponseDTO;

/**
 * Service de conversion entre documents du flux commercial.
 *
 * Flux 1 : Facture directe (sans source)
 *   --> FactureService.create() directement
 *
 * Flux 2 : Devis court
 *   devisVersFacture() --> marque le Devis CONVERTED --> cree la Facture
 *
 * Flux 3 : Flux complet
 *   devisVersBonCommande()        --> marque Devis CONVERTED    --> cree BonCommande
 *   bonCommandeVersCommande()     --> marque BonCommande CONVERTED --> cree Commande
 *   commandeVersBonLivraison()    --> marque Commande DELIVERED  --> cree BonLivraison
 *   bonLivraisonVersFacture()     --> marque BonLivraison CLOSED --> cree Facture
 *
 * Raccourci dans le flux complet :
 *   commandeVersFacture()         --> marque Commande DELIVERED  --> cree Facture directe
 */
public interface ConversionService {

    // Flux 2 : Devis --> Facture directe
    FactureResponseDTO devisVersFacture(Long devisId, ConversionRequestDTO dto);

    // Flux 3 etape 1 : Devis --> Bon de Commande
    BonCommandeResponseDTO devisVersBonCommande(Long devisId, ConversionRequestDTO dto);

    // Flux 3 etape 2 : Bon de Commande --> Commande
    CommandeResponseDTO bonCommandeVersCommande(Long bonCommandeId, ConversionRequestDTO dto);

    // Flux 3 etape 3a : Commande --> Bon de Livraison
    BonLivraisonResponseDTO commandeVersBonLivraison(Long commandeId, ConversionRequestDTO dto);

    // Flux 3 etape 3b : Commande --> Facture directe (sans BL)
    FactureResponseDTO commandeVersFacture(Long commandeId, ConversionRequestDTO dto);

    // Flux 3 etape 4 : Bon de Livraison --> Facture
    FactureResponseDTO bonLivraisonVersFacture(Long bonLivraisonId, ConversionRequestDTO dto);
}