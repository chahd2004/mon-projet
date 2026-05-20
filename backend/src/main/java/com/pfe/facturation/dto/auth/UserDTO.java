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
public class UserDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private UserRole role;
    private AccountStatus accountStatus;
    private boolean firstLogin;
    private boolean enabled;
    private Long entrepriseId;
}