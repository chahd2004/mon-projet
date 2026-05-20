package com.pfe.facturation.service;

import com.pfe.facturation.dto.request.CreateCollaborateurRequest;
import com.pfe.facturation.dto.request.UpdateUserRequest;
import com.pfe.facturation.dto.response.UserResponseDTO;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import java.util.List;

public interface UserService {
    List<User> findAll();
    User findById(Long id);
    User updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
    User createCollaborateur(CreateCollaborateurRequest request, Emetteur emetteur);
    List<User> getCollaborateursByEmetteur(Long emetteurId);
    void desactiverCollaborateur(Long id);
    UserResponseDTO convertToDTO(User user);
    List<User> getCollaborateursByEntrepriseId(Long entrepriseId);
}