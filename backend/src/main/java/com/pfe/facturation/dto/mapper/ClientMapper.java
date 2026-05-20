package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.ClientRequestDTO;
import com.pfe.facturation.dto.response.ClientResponseDTO;
import com.pfe.facturation.entity.Client;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import org.springframework.stereotype.Component;

@Component
public class ClientMapper {

    /**
     * Convertit un ClientRequestDTO en entité Client
     */
    public Client toEntity(ClientRequestDTO request) {
        if (request == null) {
            return null;
        }

        Client client = new Client();

        client.setRaisonSociale(request.getRaisonSociale());
        client.setAdresseComplete(request.getAdresseComplete());
        client.setPays(request.getPays() != null ? request.getPays() : "TUNISIE");
        client.setRegion(request.getRegion());
        client.setEmail(request.getEmail());
        client.setTelephone(request.getTelephone());

        return client;
    }

    /**
     * Convertit un ClientRequestDTO en entité Client avec un User associé
     * Utilisé lors de l'inscription
     */
    public Client toEntityWithUser(ClientRequestDTO request, User user) {
        if (request == null) {
            return null;
        }

        Client client = toEntity(request);
        if (user != null) {
            client.setUser(user);
            client.setEmail(user.getEmail());
        }
        return client;
    }

    /**
     * Met à jour une entité Client existante à partir d'un DTO
     */
    public void updateEntity(Client client, ClientRequestDTO request) {
        if (request == null || client == null) {
            return;
        }

        client.setRaisonSociale(request.getRaisonSociale());
        client.setAdresseComplete(request.getAdresseComplete());
        client.setPays(request.getPays() != null ? request.getPays() : "TUNISIE");
        client.setRegion(request.getRegion());
        client.setEmail(request.getEmail());
        client.setTelephone(request.getTelephone());
    }

    /**
     * Met à jour une entité Client sans modifier l'email
     */
    public void updateEntityWithoutEmail(Client client, ClientRequestDTO request) {
        if (request == null || client == null) {
            return;
        }

        client.setRaisonSociale(request.getRaisonSociale());
        client.setAdresseComplete(request.getAdresseComplete());
        client.setPays(request.getPays() != null ? request.getPays() : "TUNISIE");
        client.setRegion(request.getRegion());
        client.setTelephone(request.getTelephone());
        // NE PAS METTRE À JOUR L'EMAIL
    }

    /**
     * Convertit une entité Client en ClientResponseDTO
     */
    public ClientResponseDTO toDto(Client client) {
        if (client == null) {
            return null;
        }

        ClientResponseDTO dto = new ClientResponseDTO();
        dto.setId(client.getId());
        dto.setRaisonSociale(client.getRaisonSociale());
        dto.setAdresseComplete(client.getAdresseComplete());
        dto.setPays(client.getPays());
        dto.setRegion(client.getRegion());
        dto.setEmail(client.getEmail());
        dto.setTelephone(client.getTelephone());

        // Ajouter les informations utilisateur si disponibles
        if (client.getUser() != null) {
            dto.setUserId(client.getUser().getId());
            dto.setUserEmail(client.getUser().getEmail());
            dto.setUserRole(client.getUser().getRole());  // ← UserRole
            dto.setUserEnabled(client.getUser().isEnabled());
            dto.setUserAccountStatus(client.getUser().getAccountStatus()); // ← Nouveau
        }

        return dto;
    }
}