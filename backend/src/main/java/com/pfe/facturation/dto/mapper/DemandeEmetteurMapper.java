package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.EmetteurDemandeRequest;
import com.pfe.facturation.dto.request.EmetteurRequestDTO;  // ← IMPORT MANQUANT
import com.pfe.facturation.dto.response.DemandeDetailResponse;
import com.pfe.facturation.dto.response.EmetteurDemandeResponse;
import com.pfe.facturation.entity.DemandeEmetteur;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.AccountStatus;  // ← IMPORT MANQUANT
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper pour les demandes de création d'entreprise
 * Convertit entre les entités DemandeEmetteur et les DTOs
 */
@Component
public class DemandeEmetteurMapper {

    /**
     * Convertit une requête de demande en entité DemandeEmetteur
     * @param request La requête du formulaire public
     * @param ipAdresse IP du demandeur (pour traçabilité)
     * @param userAgent User agent du navigateur
     * @return L'entité DemandeEmetteur prête à être sauvegardée
     */
    public DemandeEmetteur toEntity(EmetteurDemandeRequest request, String ipAdresse, String userAgent) {
        if (request == null) {
            return null;
        }

        return DemandeEmetteur.builder()
                // Informations entreprise
                .code(request.getCode())
                .raisonSociale(request.getRaisonSociale())
                .matriculeFiscal(request.getMatriculeFiscal())
                .formeJuridique(request.getFormeJuridique())
                .adresseComplete(request.getAdresseComplete())
                .region(request.getRegion())
                .email(request.getEmail())
                .telephone(request.getTelephone())
                .siteWeb(request.getSiteWeb())
                .iban(request.getIban())
                .banque(request.getBanque())

                // Informations responsable
                .nomResponsable(request.getNomResponsable())
                .prenomResponsable(request.getPrenomResponsable())
                .fonctionResponsable(request.getFonctionResponsable())

                // Métadonnées
                .dateSoumission(LocalDateTime.now())
                .ipAdresse(ipAdresse)
                .userAgent(userAgent)

                // Statut par défaut (REQUESTED)
                .status(AccountStatus.REQUESTED)
                .build();
    }

    /**
     * Convertit une entité DemandeEmetteur en réponse de soumission
     * @param demande L'entité sauvegardée
     * @return La réponse à envoyer au client
     */
    public EmetteurDemandeResponse toResponse(DemandeEmetteur demande) {
        if (demande == null) {
            return null;
        }

        return EmetteurDemandeResponse.builder()
                .demandeId(demande.getId())
                .email(demande.getEmail())
                .dateSoumission(demande.getDateSoumission())
                .statut(demande.getStatus())
                .message(generateMessage(demande.getStatus()))
                .build();
    }

    /**
     * Convertit une entité DemandeEmetteur en réponse détaillée pour SUPER_ADMIN
     * @param demande L'entité
     * @return Les détails complets de la demande
     */
    public DemandeDetailResponse toDetailResponse(DemandeEmetteur demande) {
        if (demande == null) {
            return null;
        }

        Emetteur emetteurCree = demande.getEmetteurCree();

        return DemandeDetailResponse.builder()
                .id(demande.getId())
                .code(emetteurCree != null ? emetteurCree.getCode() : demande.getCode())
                .raisonSociale(emetteurCree != null ? emetteurCree.getRaisonSociale() : demande.getRaisonSociale())
                .matriculeFiscal(emetteurCree != null ? emetteurCree.getMatriculeFiscal() : demande.getMatriculeFiscal())
                .formeJuridique(emetteurCree != null ? emetteurCree.getFormeJuridique() : demande.getFormeJuridique())
                .adresseComplete(emetteurCree != null ? emetteurCree.getAdresseComplete() : demande.getAdresseComplete())
                .region(emetteurCree != null ? emetteurCree.getRegion() : demande.getRegion())
                .email(emetteurCree != null ? emetteurCree.getEmail() : demande.getEmail())
                .telephone(emetteurCree != null ? emetteurCree.getTelephone() : demande.getTelephone())
                .siteWeb(emetteurCree != null && emetteurCree.getSiteWeb() != null ? emetteurCree.getSiteWeb() : demande.getSiteWeb())
                .iban(emetteurCree != null && emetteurCree.getIban() != null ? emetteurCree.getIban() : demande.getIban())
                .banque(emetteurCree != null && emetteurCree.getBanque() != null ? emetteurCree.getBanque() : demande.getBanque())
                .nomResponsable(demande.getNomResponsable())
                .prenomResponsable(demande.getPrenomResponsable())
                .fonctionResponsable(demande.getFonctionResponsable())
                .status(demande.getStatus())
                .dateSoumission(demande.getDateSoumission())
                .dateTraitement(demande.getDateTraitement())
                .commentaireTraitement(demande.getCommentaireTraitement())
                .build();
    }

    /**
     * Prépare la création d'un émetteur à partir d'une demande approuvée
     * @param demande La demande approuvée
     * @return Un EmetteurRequestDTO pré-rempli
     */
    public EmetteurRequestDTO toEmetteurRequest(DemandeEmetteur demande) {
        if (demande == null) {
            return null;
        }

        EmetteurRequestDTO dto = new EmetteurRequestDTO();
        dto.setCode(demande.getCode());
        dto.setRaisonSociale(demande.getRaisonSociale());
        dto.setMatriculeFiscal(demande.getMatriculeFiscal());
        dto.setFormeJuridique(demande.getFormeJuridique());
        dto.setAdresseComplete(demande.getAdresseComplete());
        dto.setRegion(demande.getRegion());
        dto.setEmail(demande.getEmail());
        dto.setTelephone(demande.getTelephone());
        dto.setSiteWeb(demande.getSiteWeb());
        dto.setIban(demande.getIban());
        dto.setBanque(demande.getBanque());

        // Le userId sera ajouté après création de l'utilisateur
        return dto;
    }

    /**
     * Génère un message approprié selon le statut
     */
    private String generateMessage(AccountStatus status) {
        if (status == null) {
            return "Demande reçue";
        }

        switch (status) {
            case REQUESTED:
                return "Votre demande a été soumise avec succès et est en attente de traitement par nos services. Vous recevrez un email dès que votre compte sera créé.";
            case REJECTED:
                return "Votre demande a été traitée mais n'a pas pu être acceptée. Vous recevrez un email avec les détails.";
            case PENDING:
                return "Votre compte a été créé ! Un email avec vos identifiants vous a été envoyé.";
            case ACTIVE:
                return "Votre compte est actif.";
            case DISABLED:
                return "Votre compte a été désactivé.";
            case EXPIRED:
                return "Votre abonnement a expiré.";
            default:
                return "Demande reçue";
        }
    }
}