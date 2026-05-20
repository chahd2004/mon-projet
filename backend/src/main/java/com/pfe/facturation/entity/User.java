package com.pfe.facturation.entity;

import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Entité représentant un utilisateur du système.
 */
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email", name = "uk_users_email"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String nom;

    @Column(length = 50)
    private String prenom;

    @Column(length = 20)
    private String telephone;

    /**
     * Rôle unique de l'utilisateur (sécurité + métier)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    /**
     * Statut du compte dans son cycle de vie
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.PENDING;

    /**
     * Indique si l'utilisateur se connecte pour la première fois
     * Utilisé pour forcer le changement de mot de passe
     */
    @Builder.Default
    private boolean firstLogin = true;

    /**
     * Date de dernière connexion
     */
    private LocalDateTime lastLoginDate;

    /**
     * Date du dernier changement de mot de passe
     */
    private LocalDateTime passwordChangedDate;

    /**
     * Date de création du compte (gérée automatiquement)
     */
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /**
     * Date de dernière modification
     */
    private LocalDateTime updatedAt;

    /**
     * Date d'expiration du mot de passe
     */
    private LocalDateTime passwordExpiryDate;

    // ========== RELATIONS ==========

    /**
     * Entreprise à laquelle appartient ce collaborateur (ENTREPRISE_VIEWER)
     * FK entreprise_id sur la table users
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id")
    private Emetteur entreprise;

    // ========== MÉTHODES DE CYCLE DE VIE JPA ==========

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ========== MÉTHODES SPRING SECURITY ==========

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        return authorities;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return !isPasswordExpired();
    }

    @Override
    public boolean isEnabled() {
        return accountStatus == AccountStatus.ACTIVE ||
                (accountStatus == AccountStatus.PENDING && firstLogin);
    }

    // ========== MÉTHODES MÉTIER ==========

    public boolean isPasswordExpired() {
        if (passwordExpiryDate == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(passwordExpiryDate);
    }

    public boolean isSuperAdmin() {
        return UserRole.SUPER_ADMIN.equals(role);
    }

    public boolean isEntrepriseAdmin() {
        return UserRole.ENTREPRISE_ADMIN.equals(role);
    }

    public boolean isEntrepriseViewer() {
        return UserRole.ENTREPRISE_VIEWER.equals(role);
    }

    public boolean isEntrepriseManager() {
        return UserRole.ENTREPRISE_MANAGER.equals(role);
    }

    public boolean canBuy() {
        return isEntrepriseAdmin() || isSuperAdmin() || isEntrepriseViewer() || isEntrepriseManager();
    }

    public boolean canSell() {
        return isEntrepriseAdmin() || isSuperAdmin() || isEntrepriseManager();
    }

    public boolean canLogin() {
        return accountStatus == AccountStatus.ACTIVE ||
                (accountStatus == AccountStatus.PENDING && firstLogin);
    }

    public void processFirstLogin() {
        this.firstLogin = false;
        this.accountStatus = AccountStatus.ACTIVE;
        this.lastLoginDate = LocalDateTime.now();
        this.passwordChangedDate = LocalDateTime.now();
    }
}