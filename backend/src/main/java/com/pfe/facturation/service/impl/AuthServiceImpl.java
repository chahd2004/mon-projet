package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.auth.*;
import com.pfe.facturation.dto.request.UpdateUserRequest;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.AccountNotActivatedException;
import com.pfe.facturation.exception.PasswordExpiredException;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.UserRepository;
import com.pfe.facturation.security.JwtService;
import com.pfe.facturation.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final EmetteurRepository emetteurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé : " + request.getEmail());
        }

        UserRole role = determineRole(request);
        AccountStatus accountStatus = determineAccountStatus(role);

        User savedUser;
        if (role == UserRole.ENTREPRISE_ADMIN) {
            savedUser = createEntrepriseAdmin(request, accountStatus);
        } else {
            User user = User.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .nom(request.getNom())
                    .prenom(request.getPrenom())
                    .telephone(request.getTelephone())
                    .role(role)
                    .accountStatus(accountStatus)
                    .firstLogin(role != UserRole.SUPER_ADMIN)
                    .build();

            savedUser = userRepository.save(user);
        }

        return buildAuthResponse(savedUser, savedUser.isFirstLogin());
    }

    private User createEntrepriseAdmin(RegisterRequest request, AccountStatus accountStatus) {
        Emetteur emetteur = Emetteur.builder()
                .raisonSociale(request.getRaisonSociale())
                .matriculeFiscal(request.getMatriculeFiscal())
                .code(request.getCode())
                .formeJuridique(request.getFormeJuridique())
                .adresseComplete(request.getAdresseComplete())
                .region(request.getRegion())
                .email(request.getEmail())
                .telephone(request.getTelephone())
                .build();

        Emetteur savedEmetteur = emetteurRepository.save(emetteur);
        log.info("Émetteur créé avec ID: {}", savedEmetteur.getId());

        User admin = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .role(UserRole.ENTREPRISE_ADMIN)
                .accountStatus(accountStatus)
                .firstLogin(true)
                .entreprise(savedEmetteur)
                .build();

        User savedAdmin = userRepository.save(admin);
        log.info("Admin créé avec entreprise_id: {}",
                savedAdmin.getEntreprise() != null ? savedAdmin.getEntreprise().getId() : "null");

        savedEmetteur.setUser(savedAdmin);
        emetteurRepository.save(savedEmetteur);

        return savedAdmin;
    }

    @Override
    public AuthResponse authenticate(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        checkUserCanLogin(user);

        user.setLastLoginDate(LocalDateTime.now());
        userRepository.save(user);

        boolean requirePasswordChange = user.isFirstLogin() || user.isPasswordExpired();

        return buildAuthResponse(user, requirePasswordChange);
    }

    @Override
    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return toUserDTO(user);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadCredentialsException("Ancien mot de passe incorrect");
        }

        if (!request.isMatchingPasswords()) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedDate(LocalDateTime.now());
        user.setPasswordExpiryDate(null);
        user.setFirstLogin(false);
        user.setAccountStatus(AccountStatus.ACTIVE);

        userRepository.save(user);

        log.info("Mot de passe changé pour l'utilisateur: {}", userEmail);
    }
    
    @Override
    @Transactional
    public UserDTO updateProfile(UpdateUserRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        if (request.getNom() != null) user.setNom(request.getNom());
        if (request.getPrenom() != null) user.setPrenom(request.getPrenom());
        if (request.getTelephone() != null) user.setTelephone(request.getTelephone());
        
        User savedUser = userRepository.save(user);
        log.info("Profil mis à jour pour l'utilisateur: {}", email);
        
        return toUserDTO(savedUser);
    }

    private UserRole determineRole(RegisterRequest request) {
        if (request.getRole() != null) {
            return request.getRole();
        }
        return UserRole.ENTREPRISE_ADMIN;
    }

    private AccountStatus determineAccountStatus(UserRole role) {
        if (role == UserRole.SUPER_ADMIN) {
            return AccountStatus.ACTIVE;
        }
        return AccountStatus.PENDING;
    }

    private void checkUserCanLogin(User user) {
        if (user.getAccountStatus() == AccountStatus.DISABLED) {
            throw new AccountNotActivatedException("Votre compte a été désactivé. Contactez l'administrateur.");
        }

        if (user.getAccountStatus() == AccountStatus.EXPIRED) {
            throw new AccountNotActivatedException("Votre abonnement a expiré. Contactez l'administrateur.");
        }

        if (user.getAccountStatus() == AccountStatus.REQUESTED) {
            throw new AccountNotActivatedException("Votre demande est en attente de validation par l'administrateur.");
        }

        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            throw new AccountNotActivatedException("Votre demande a été rejetée. Contactez l'administrateur.");
        }

        if (user.isPasswordExpired()) {
            throw new PasswordExpiredException(
                    "Votre mot de passe temporaire a expiré. Veuillez contacter l'administrateur."
            );
        }
    }

    private AuthResponse buildAuthResponse(User user, boolean requirePasswordChange) {
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .firstLogin(user.isFirstLogin())
                .requirePasswordChange(requirePasswordChange)
                .message(requirePasswordChange ? "Vous devez changer votre mot de passe" : null)
                .entrepriseId(user.getEntreprise() != null ? user.getEntreprise().getId() : null)
                .build();
    }

    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .firstLogin(user.isFirstLogin())
                .enabled(user.isEnabled())
                .entrepriseId(user.getEntreprise() != null ? user.getEntreprise().getId() : null)
                .build();
    }
}