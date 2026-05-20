package com.pfe.facturation.dto.auth;

import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String telephone;
    private UserRole role;
    private AccountStatus accountStatus;
    private boolean firstLogin;
    private boolean requirePasswordChange;
    private String message;
    private Long entrepriseId;
}