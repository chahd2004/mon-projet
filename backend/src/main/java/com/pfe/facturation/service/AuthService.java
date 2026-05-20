package com.pfe.facturation.service;

import com.pfe.facturation.dto.auth.AuthResponse;
import com.pfe.facturation.dto.auth.LoginRequest;
import com.pfe.facturation.dto.auth.RegisterRequest;
import com.pfe.facturation.dto.auth.UserDTO;
import com.pfe.facturation.dto.auth.ChangePasswordRequest;
import com.pfe.facturation.dto.request.UpdateUserRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse authenticate(LoginRequest request);
    UserDTO getCurrentUser(String email);
    void changePassword(ChangePasswordRequest request, String userEmail);
    UserDTO updateProfile(UpdateUserRequest request, String email);
}