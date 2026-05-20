package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.request.CreateCollaborateurRequest;
import com.pfe.facturation.dto.request.UpdateUserRequest;
import com.pfe.facturation.dto.response.UserResponseDTO;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.DuplicateResourceException;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.UserRepository;
import com.pfe.facturation.service.EmailService;
import com.pfe.facturation.service.PasswordGeneratorService;
import com.pfe.facturation.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final EmetteurRepository emetteurRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGeneratorService passwordGenerator;
    private final EmailService emailService;

    @Override
    public User createCollaborateur(CreateCollaborateurRequest request, Emetteur emetteur) {
        // 1. Recharger l'émetteur
        Emetteur managedEmetteur = emetteurRepository.findById(emetteur.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Émetteur non trouvé avec l'id: " + emetteur.getId()));

        // 2. Vérifier si l'email existe
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Un utilisateur avec cet email existe déjà");
        }

        // 3. Déterminer le rôle (défaut : ENTREPRISE_VIEWER)
        UserRole role = (request.getRole() != null) ? request.getRole() : UserRole.ENTREPRISE_VIEWER;
        
        // Seuls ENTREPRISE_VIEWER et ENTREPRISE_MANAGER sont autorisés comme collaborateurs
        if (role != UserRole.ENTREPRISE_VIEWER && role != UserRole.ENTREPRISE_MANAGER) {
            role = UserRole.ENTREPRISE_VIEWER;
        }

        // 4. Générer mot de passe temporaire
        String temporaryPassword = passwordGenerator.generateSecurePassword();

        // 5. Créer l'utilisateur
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(temporaryPassword))
                .nom(request.getLastName())
                .prenom(request.getFirstName())
                .role(role)
                .accountStatus(AccountStatus.PENDING)
                .firstLogin(true)
                .passwordExpiryDate(LocalDateTime.now().plusHours(24))
                .entreprise(managedEmetteur)
                .build();

        User savedUser = userRepository.save(user);

        // 6. Envoyer l'email avec le bon rôle
        emailService.sendCompteCreeEmail(
                savedUser.getEmail(),
                savedUser.getPrenom(),
                savedUser.getNom(),
                temporaryPassword,
                managedEmetteur.getRaisonSociale(),
                role);

        log.info("Collaborateur créé: {} avec le rôle: {}", savedUser.getEmail(), role);
        return savedUser;
    }

    @Override
    public List<User> getCollaborateursByEmetteur(Long emetteurId) {
        return userRepository.findByEntrepriseId(emetteurId);
    }

    @Override
    public void desactiverCollaborateur(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        user.setAccountStatus(AccountStatus.DISABLED);
        userRepository.save(user);
        log.info("Collaborateur désactivé: {}", user.getEmail());
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id: " + id));
    }

    @Override
    public List<User> getCollaborateursByEntrepriseId(Long entrepriseId) {
        return userRepository.findByEntrepriseId(entrepriseId);
    }

    @Override
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = findById(id);

        if (request.getNom() != null) user.setNom(request.getNom());
        if (request.getPrenom() != null) user.setPrenom(request.getPrenom());
        if (request.getTelephone() != null) user.setTelephone(request.getTelephone());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getAccountStatus() != null) user.setAccountStatus(request.getAccountStatus());

        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        log.info("Utilisateur supprimé: {}", id);
    }

    @Override
    public UserResponseDTO convertToDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .firstLogin(user.isFirstLogin())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginDate(user.getLastLoginDate())
                .entrepriseId(user.getEntreprise() != null ? user.getEntreprise().getId() : null)
                .build();
    }
}