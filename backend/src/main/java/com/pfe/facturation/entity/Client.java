package com.pfe.facturation.entity;

import com.pfe.facturation.enums.RegionTunisie;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "clients")
@Data // ← Lombok
@NoArgsConstructor // ← Constructeur sans param
@AllArgsConstructor // ← Constructeur avec tous les params
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La raison sociale est obligatoire")
    private String raisonSociale;

    @NotBlank(message = "L'adresse est obligatoire")
    private String adresseComplete;

    private String pays = "TUNISIE";

    @Enumerated(EnumType.STRING)
    @NotNull(message = "La région est obligatoire")
    private RegionTunisie region;

    @Email(message = "Format d'email invalide")
    private String email;

    @Pattern(regexp = "^[0-9]{8}$", message = "Le téléphone doit contenir exactement 8 chiffres")
    private String telephone;

    @OneToMany(mappedBy = "acheteurClient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Facture> factures = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emetteur_id")
    private Emetteur emetteur;
}