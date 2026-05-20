package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.DemandeEmetteurMapper;
import com.pfe.facturation.dto.mapper.EmetteurMapper;
import com.pfe.facturation.dto.request.EmetteurDemandeRequest;
import com.pfe.facturation.dto.request.TraiterDemandeRequest;
import com.pfe.facturation.dto.response.DemandeDetailResponse;
import com.pfe.facturation.dto.response.EmetteurDemandeResponse;
import com.pfe.facturation.entity.DemandeEmetteur;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.DemandeEmetteurRepository;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.UserRepository;
import com.pfe.facturation.service.DemandeEmetteurService;
import com.pfe.facturation.service.EmailService;
import com.pfe.facturation.service.PasswordGeneratorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service de gestion des demandes de création d'entreprise
 * Gère le cycle complet : soumission, approbation, rejet
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DemandeEmetteurServiceImpl implements DemandeEmetteurService {

    private final DemandeEmetteurRepository demandeRepository;
    private final EmetteurRepository emetteurRepository;
    private final UserRepository userRepository;
    private final DemandeEmetteurMapper demandeMapper;
    private final EmetteurMapper emetteurMapper;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGeneratorService passwordGenerator;
    private final EmailService emailService;

    /**
     * Soumet une nouvelle demande de création d'entreprise
     * Envoie l'email de confirmation (EMAIL 1)
     *
     * @param request Les données de la demande
     * @param httpRequest Informations HTTP pour traçabilité
     * @return La réponse avec l'ID de la demande
     */
    @Override
    public EmetteurDemandeResponse soumettreDemande(EmetteurDemandeRequest request, HttpServletRequest httpRequest) {
        log.info("Nouvelle demande reçue pour l'email: {}", request.getEmail());

        // Vérifier si une demande existe déjà pour cet email
        if (demandeRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Une demande avec cet email existe déjà");
        }

        // Vérifier si un utilisateur existe déjà avec cet email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé par un compte existant");
        }

        // Récupérer les infos de la requête HTTP pour traçabilité
        String ipAdresse = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");

        // Créer la demande
        DemandeEmetteur demande = demandeMapper.toEntity(request, ipAdresse, userAgent);
        DemandeEmetteur savedDemande = demandeRepository.save(demande);

        // EMAIL 1 : Confirmation de soumission
        emailService.sendDemandeSoumiseEmail(
                savedDemande.getEmail(),
                savedDemande.getPrenomResponsable(),
                savedDemande.getNomResponsable()
        );

        log.info("Demande enregistrée avec ID: {}", savedDemande.getId());
        return demandeMapper.toResponse(savedDemande);
    }

    /**
     * Récupère toutes les demandes (indépendamment du statut)
     *
     * @return Liste de toutes les demandes
     */
    @Override
    public List<DemandeDetailResponse> getAllDemandes() {
        return demandeRepository.findAll()
                .stream()
                .map(demandeMapper::toDetailResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les demandes en attente (statut REQUESTED)
     *
     * @return Liste des demandes en attente
     */
    @Override
    public List<DemandeDetailResponse> getDemandesEnAttente() {
        return demandeRepository.findByStatus(AccountStatus.REQUESTED)
                .stream()
                .map(demandeMapper::toDetailResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les détails d'une demande spécifique
     *
     * @param id L'ID de la demande
     * @return Les détails complets
     */
    @Override
    public DemandeDetailResponse getDemandeDetails(Long id) {
        DemandeEmetteur demande = demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée avec l'id: " + id));
        return demandeMapper.toDetailResponse(demande);
    }

    /**
     * Approuve une demande et crée le compte entreprise
     * Envoie l'email de création de compte (EMAIL 2) avec le rôle ADMIN
     *
     * @param id L'ID de la demande à approuver
     * @param request Commentaire optionnel
     */
    @Override
    @Transactional
    public void approuverDemande(Long id, TraiterDemandeRequest request) {
        log.info("Approbation de la demande ID: {}", id);

        DemandeEmetteur demande = demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée"));

        // Vérifier que la demande est en attente
        if (demande.getStatus() != AccountStatus.REQUESTED) {
            throw new RuntimeException("Cette demande a déjà été traitée");
        }

        // 1. Créer l'utilisateur (ENTREPRISE_ADMIN)
        String motDePasseTemporaire = passwordGenerator.generateSecurePassword();

        User user = User.builder()
                .email(demande.getEmail())
                .password(passwordEncoder.encode(motDePasseTemporaire))
                .nom(demande.getNomResponsable())
                .prenom(demande.getPrenomResponsable())
                .role(UserRole.ENTREPRISE_ADMIN)
                .accountStatus(AccountStatus.PENDING)
                .firstLogin(true)
                .passwordExpiryDate(LocalDateTime.now().plusHours(24))
                .build();

        User savedUser = userRepository.save(user);

        // 2. Créer l'émetteur (entreprise)
        Emetteur emetteur = Emetteur.builder()
                .code(demande.getCode())
                .raisonSociale(demande.getRaisonSociale())
                .matriculeFiscal(demande.getMatriculeFiscal())
                .formeJuridique(demande.getFormeJuridique())
                .adresseComplete(demande.getAdresseComplete())
                .region(demande.getRegion())
                .email(demande.getEmail())
                .telephone(demande.getTelephone())
                .siteWeb(demande.getSiteWeb())
                .iban(demande.getIban())
                .banque(demande.getBanque())
                .user(savedUser)
                .build();

        Emetteur savedEmetteur = emetteurRepository.save(emetteur);

        // Mettre à jour l'utilisateur avec l'émetteur
        savedUser.setEntreprise(savedEmetteur);
        userRepository.save(savedUser);

        // 3. Mettre à jour la demande
        demande.setStatus(AccountStatus.PENDING);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setCommentaireTraitement(request != null ? request.getCommentaire() : "Approuvée");
        demande.setUserCree(savedUser);
        demande.setEmetteurCree(savedEmetteur);

        demandeRepository.save(demande);

        // EMAIL 2 : Envoi des identifiants avec le rôle ADMIN
        emailService.sendCompteCreeEmail(
                demande.getEmail(),
                demande.getPrenomResponsable(),
                demande.getNomResponsable(),
                motDePasseTemporaire,
                demande.getRaisonSociale(),
                UserRole.ENTREPRISE_ADMIN
        );

        log.info("Demande approuvée, compte créé pour: {}", demande.getEmail());
    }

    /**
     * Rejette une demande avec un commentaire
     * Envoie l'email de rejet (EMAIL 3)
     *
     * @param id L'ID de la demande à rejeter
     * @param request Commentaire obligatoire (raison du rejet)
     */
    @Override
    @Transactional
    public void rejeterDemande(Long id, TraiterDemandeRequest request) {
        log.info("Rejet de la demande ID: {}", id);

        DemandeEmetteur demande = demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée"));

        // Vérifier que la demande est en attente
        if (demande.getStatus() != AccountStatus.REQUESTED) {
            throw new RuntimeException("Cette demande a déjà été traitée");
        }

        // Vérifier que le commentaire est fourni
        if (request == null || request.getCommentaire() == null || request.getCommentaire().trim().isEmpty()) {
            throw new RuntimeException("Un commentaire est obligatoire pour justifier le rejet");
        }

        // Mettre à jour la demande
        demande.setStatus(AccountStatus.REJECTED);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setCommentaireTraitement(request.getCommentaire());

        demandeRepository.save(demande);

        // EMAIL 3 : Notification de rejet
        emailService.sendDemandeRejeteeEmail(
                demande.getEmail(),
                demande.getPrenomResponsable(),
                demande.getNomResponsable(),
                request.getCommentaire(),
                demande.getRaisonSociale()
        );

        log.info("Demande rejetée pour: {}", demande.getEmail());
    }

    /**
     * Vérifie le statut d'une demande par email
     *
     * @param email L'email de la demande
     * @return Le statut ou "NOT_FOUND"
     */
    @Override
    public String verifierStatutDemande(String email) {
        return demandeRepository.findByEmail(email)
                .map(demande -> demande.getStatus().name())
                .orElse("NOT_FOUND");
    }

    /**
     * Vérifie si une demande existe pour cet email
     *
     * @param email L'email à vérifier
     * @return true si une demande existe
     */
    @Override
    public boolean existsByEmail(String email) {
        return demandeRepository.existsByEmail(email);
    }
}