package com.pfe.facturation.service.impl;

import com.pfe.facturation.dto.mapper.ClientMapper;
import com.pfe.facturation.dto.request.ClientRequestDTO;
import com.pfe.facturation.dto.response.ClientResponseDTO;
import com.pfe.facturation.entity.Client;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import com.pfe.facturation.enums.UserRole;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.repository.EmetteurRepository;
import com.pfe.facturation.repository.UserRepository;
import com.pfe.facturation.service.ClientService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final EmetteurRepository emetteurRepository;
    private final ClientMapper clientMapper;

    public ClientServiceImpl(
            ClientRepository clientRepository,
            UserRepository userRepository,
            EmetteurRepository emetteurRepository,
            ClientMapper clientMapper) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.emetteurRepository = emetteurRepository;
        this.clientMapper = clientMapper;
    }

    @Override
    public ClientResponseDTO create(ClientRequestDTO request) {
        if (clientRepository.existsByEmail(request.getEmail())) {
            throw new com.pfe.facturation.exception.DuplicateResourceException("Un client avec cet email existe déjà");
        }

        Client client = clientMapper.toEntity(request);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            client.setUser(user);
            
            // Lier à l'émetteur (entreprise)
            if (user.getRole() != UserRole.SUPER_ADMIN) {
                if (user.getEntreprise() != null) {
                    client.setEmetteur(user.getEntreprise());
                } else {
                    // Repli sur la recherche directe si l'entité User n'a pas encore l'entreprise chargée
                    emetteurRepository.findByUserId(request.getUserId())
                            .ifPresent(client::setEmetteur);
                }
            }
        }

        return clientMapper.toDto(clientRepository.save(client));
    }

    @Override
    public List<ClientResponseDTO> findAll() {
        return clientRepository.findAll()
                .stream()
                .map(clientMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ClientResponseDTO findById(Long id) {
        return clientMapper.toDto(
                clientRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Client non trouvé: " + id))
        );
    }

    @Override
    public ClientResponseDTO update(Long id, ClientRequestDTO request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client non trouvé: " + id));

        client.setRaisonSociale(request.getRaisonSociale());
        client.setAdresseComplete(request.getAdresseComplete());
        client.setRegion(request.getRegion());
        client.setEmail(request.getEmail());
        client.setTelephone(request.getTelephone());

        // Rattacher à l'émetteur lors de la mise à jour si missing
        if (request.getUserId() != null && client.getEmetteur() == null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (user.getRole() != UserRole.SUPER_ADMIN) {
                if (user.getEntreprise() != null) {
                    client.setEmetteur(user.getEntreprise());
                } else {
                    emetteurRepository.findByUserId(request.getUserId())
                            .ifPresent(client::setEmetteur);
                }
            }
        }

        return clientMapper.toDto(clientRepository.save(client));
    }

    @Override
    public void delete(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client non trouvé: " + id);
        }
        clientRepository.deleteById(id);
    }

    @Override
    public ClientResponseDTO findByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + userId));
        return clientMapper.toDto(
                clientRepository.findByUserId(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Aucun client pour cet utilisateur"))
        );
    }

    @Override
    public ClientResponseDTO updateByUserId(Long userId, ClientRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + userId));
        Client client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun client pour cet utilisateur"));

        client.setRaisonSociale(request.getRaisonSociale());
        client.setAdresseComplete(request.getAdresseComplete());
        client.setRegion(request.getRegion());
        client.setTelephone(request.getTelephone());

        // Assurer le lien emetteur
        if (client.getEmetteur() == null && user.getEntreprise() != null) {
            client.setEmetteur(user.getEntreprise());
        }

        return clientMapper.toDto(clientRepository.save(client));
    }

    @Override
    public boolean existsByEmail(String email) {
        return clientRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByUserId(Long userId) {
        return clientRepository.existsByUserId(userId);
    }

    @Override
    public long count() {
        return clientRepository.count();
    }

    // ═══════════════════════════════════════════════════════════════════
    // ⭐ MÉTHODE CORRIGÉE (sans findByInvoicesEmetteurId)
    // ═══════════════════════════════════════════════════════════════════
    @Override
    public List<ClientResponseDTO> getClientsByEmetteur(Long emetteurId) {
        // Clients liés à l'émetteur (directement OU via les factures)
        List<Client> clients = clientRepository.findAllByEmetteurId(emetteurId);

        return clients.stream()
                .map(clientMapper::toDto)
                .collect(Collectors.toList());
    }

    // ===== NOUVELLES MÉTHODES =====

    @Override
    public List<ClientResponseDTO> findByEmetteurUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + userId));

        Long emetteurId = null;
        if (user.getEntreprise() != null) {
            emetteurId = user.getEntreprise().getId();
        } else {
            emetteurId = emetteurRepository.findByUserId(userId)
                    .map(Emetteur::getId)
                    .orElse(null);
        }

        if (emetteurId == null) {
            return List.of();
        }

        return getClientsByEmetteur(emetteurId);
    }

    @Override
    public void checkEmetteurOwnership(Long userId, Long clientId) {
        Emetteur emetteur = emetteurRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Emetteur non trouvé pour userId: " + userId));

        List<ClientResponseDTO> clients = getClientsByEmetteur(emetteur.getId());
        boolean owns = clients.stream().anyMatch(c -> c.getId().equals(clientId));

        if (!owns) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce client ne vous appartient pas");
        }
    }
}