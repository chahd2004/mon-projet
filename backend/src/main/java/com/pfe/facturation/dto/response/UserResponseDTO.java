package com.pfe.facturation.dto.response;

import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponseDTO {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String telephone;
    private UserRole role;
    private AccountStatus accountStatus;
    private boolean firstLogin;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginDate;
    private Long entrepriseId;
}