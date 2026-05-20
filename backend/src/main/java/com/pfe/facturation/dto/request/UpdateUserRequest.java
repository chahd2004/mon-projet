package com.pfe.facturation.dto.request;

import com.pfe.facturation.enums.AccountStatus;
import com.pfe.facturation.enums.UserRole;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String nom;
    private String prenom;
    private String telephone;
    private UserRole role;
    private AccountStatus accountStatus;
    private boolean enabled;
    private Long emetteurId;
}