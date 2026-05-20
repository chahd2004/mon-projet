package com.pfe.facturation.dto.mapper;

import com.pfe.facturation.dto.request.EmetteurRequestDTO;
import com.pfe.facturation.dto.response.EmetteurResponseDTO;
import com.pfe.facturation.entity.Emetteur;
import com.pfe.facturation.entity.User;
import org.springframework.stereotype.Component;

@Component
public class EmetteurMapper {

    /**
     * Convertit un EmetteurRequestDTO en entité Emetteur
     */
    public Emetteur toEntity(EmetteurRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        Emetteur e = new Emetteur();
        e.setCode(dto.getCode());
        e.setRaisonSociale(dto.getRaisonSociale());
        e.setMatriculeFiscal(dto.getMatriculeFiscal());
        e.setFormeJuridique(dto.getFormeJuridique());
        e.setAdresseComplete(dto.getAdresseComplete());
        e.setPays(dto.getPays() != null ? dto.getPays() : "TUNISIE");
        e.setRegion(dto.getRegion());
        e.setEmail(dto.getEmail());
        e.setTelephone(dto.getTelephone());
        e.setSiteWeb(dto.getSiteWeb());
        e.setIban(dto.getIban());
        e.setBanque(dto.getBanque());

        return e;
    }

    /**
     * Convertit un EmetteurRequestDTO en entité Emetteur avec User associé
     */
    public Emetteur toEntityWithUser(EmetteurRequestDTO dto, User user) {
        if (dto == null) {
            return null;
        }

        Emetteur e = toEntity(dto);
        if (user != null) {
            e.setUser(user);
            e.setEmail(user.getEmail());
        }
        return e;
    }

    /**
     * Met à jour une entité Emetteur existante
     */
    public void updateEntity(Emetteur emetteur, EmetteurRequestDTO dto) {
        if (dto == null || emetteur == null) {
            return;
        }

        emetteur.setCode(dto.getCode());
        emetteur.setRaisonSociale(dto.getRaisonSociale());
        emetteur.setMatriculeFiscal(dto.getMatriculeFiscal());
        emetteur.setFormeJuridique(dto.getFormeJuridique());
        emetteur.setAdresseComplete(dto.getAdresseComplete());
        emetteur.setPays(dto.getPays() != null ? dto.getPays() : "TUNISIE");
        emetteur.setRegion(dto.getRegion());
        emetteur.setEmail(dto.getEmail());
        emetteur.setTelephone(dto.getTelephone());
        emetteur.setSiteWeb(dto.getSiteWeb());
        emetteur.setIban(dto.getIban());
        emetteur.setBanque(dto.getBanque());
    }

    /**
     * Met à jour une entité Emetteur sans modifier l'email
     */
    public void updateEntityWithoutEmail(Emetteur emetteur, EmetteurRequestDTO dto) {
        if (dto == null || emetteur == null) {
            return;
        }

        emetteur.setCode(dto.getCode());
        emetteur.setRaisonSociale(dto.getRaisonSociale());
        emetteur.setMatriculeFiscal(dto.getMatriculeFiscal());
        emetteur.setFormeJuridique(dto.getFormeJuridique());
        emetteur.setAdresseComplete(dto.getAdresseComplete());
        emetteur.setPays(dto.getPays() != null ? dto.getPays() : "TUNISIE");
        emetteur.setRegion(dto.getRegion());
        emetteur.setTelephone(dto.getTelephone());
        emetteur.setSiteWeb(dto.getSiteWeb());
        emetteur.setIban(dto.getIban());
        emetteur.setBanque(dto.getBanque());
        // NE PAS METTRE À JOUR L'EMAIL
    }

    /**
     * Convertit une entité Emetteur en EmetteurResponseDTO
     */
    public EmetteurResponseDTO toResponse(Emetteur e) {
        if (e == null) {
            return null;
        }

        EmetteurResponseDTO dto = new EmetteurResponseDTO();
        dto.setId(e.getId());
        dto.setCode(e.getCode());
        dto.setRaisonSociale(e.getRaisonSociale());
        dto.setMatriculeFiscal(e.getMatriculeFiscal());
        dto.setFormeJuridique(e.getFormeJuridique());
        dto.setAdresseComplete(e.getAdresseComplete());
        dto.setPays(e.getPays());
        dto.setRegion(e.getRegion());
        dto.setEmail(e.getEmail());
        dto.setTelephone(e.getTelephone());
        dto.setSiteWeb(e.getSiteWeb());
        dto.setIban(e.getIban());
        dto.setBanque(e.getBanque());

        // Compter les factures où il est vendeur
        if (e.getFacturesEnTantQueVendeur() != null) {
            dto.setFactureCount((long) e.getFacturesEnTantQueVendeur().size());
        } else {
            dto.setFactureCount(0L);
        }

        // Ajouter les informations utilisateur si disponibles
        if (e.getUser() != null) {
            dto.setUserId(e.getUser().getId());
            dto.setUserEmail(e.getUser().getEmail());
            dto.setUserRole(e.getUser().getRole());        // ← UserRole
            dto.setUserAccountStatus(e.getUser().getAccountStatus()); // ← Nouveau
            dto.setUserEnabled(e.getUser().isEnabled());
        }

        return dto;
    }
}