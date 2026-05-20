package com.pfe.facturation.service;

import com.pfe.facturation.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service de gestion des envois d'emails
 * Gère les les emails système et notifications clients
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * EMAIL 1 : Confirmation de soumission de demande
     */
    public void sendDemandeSoumiseEmail(String to, String prenom, String nom) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("📝 Demande de création de compte - Reçue");

            String content = String.format(
                    "Bonjour %s %s,\n\n" +
                            "Nous avons bien reçu votre demande de création de compte entreprise.\n\n" +
                            "📋 Votre demande est en cours de traitement\n" +
                            "Nos équipes vont vérifier les informations fournies et créer votre compte sous 24-48h.\n\n" +
                            "Vous recevrez un email dès que votre compte sera prêt avec vos identifiants de connexion.\n\n" +
                            "Pour suivre le statut de votre demande, vous pouvez utiliser ce lien :\n" +
                            "%s/demande/statut?email=%s\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    prenom, nom, frontendUrl, to
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email de confirmation de demande envoyé à : {}", to);
        } catch (Exception e) {
            log.error("Erreur envoi email demande à {} : {}", to, e.getMessage());
        }
    }

    /**
     * EMAIL 2 : Création de compte avec mot de passe temporaire
     */
    public void sendCompteCreeEmail(String to, String prenom, String nom,
                                    String motDePasseTemporaire, String nomEntreprise,
                                    UserRole role) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);

            if (role == UserRole.ENTREPRISE_ADMIN) {
                message.setSubject("✅ Votre compte administrateur a été créé !");
            } else if (role == UserRole.ENTREPRISE_MANAGER) {
                message.setSubject("✅ Votre compte gérant a été créé !");
            } else {
                message.setSubject("✅ Votre compte consultant a été créé !");
            }

            String permissions;
            if (role == UserRole.ENTREPRISE_ADMIN) {
                permissions = "• Gérer vos collaborateurs\n" +
                        "• Créer vos produits\n" +
                        "• Gérer vos clients\n" +
                        "• Émettre vos factures";
            } else if (role == UserRole.ENTREPRISE_MANAGER) {
                permissions = "• Créer vos produits\n" +
                        "• Gérer vos clients\n" +
                        "• Émettre vos factures et devis\n" +
                        "• Gérer les bons de commande et livraison";
            } else {
                permissions = "• Consulter les factures (lecture seule)\n" +
                        "• Consulter les clients (lecture seule)\n" +
                        "• Consulter les produits (lecture seule)\n" +
                        "• Accéder aux tableaux de bord";
            }

            String content = String.format(
                    "Bonjour %s %s,\n\n" +
                            "Félicitations ! Votre compte pour l'entreprise **%s** a été créé.\n\n" +
                            "🔐 Vos identifiants de connexion\n" +
                            "➖➖➖➖➖➖➖➖➖➖➖\n" +
                            "📧 Email : %s\n" +
                            "🔑 Mot de passe temporaire : %s\n\n" +
                            "⚠️ Ce mot de passe est valable 24 heures seulement.\n" +
                            "Lors de votre première connexion, vous serez invité à le changer.\n\n" +
                            "🌐 Lien de connexion :\n" +
                            "%s/login\n\n" +
                            "Une fois connecté, vous pourrez :\n" +
                            "%s\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    prenom, nom, nomEntreprise, to, motDePasseTemporaire, frontendUrl, permissions
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email de création de compte envoyé à : {} avec rôle: {}", to, role);
        } catch (Exception e) {
            log.error("Erreur envoi email création compte à {} : {}", to, e.getMessage());
        }
    }

    /**
     * EMAIL 3 : Rejet de la demande avec raison
     */
    public void sendDemandeRejeteeEmail(String to, String prenom, String nom,
                                        String raisonRejet, String nomEntreprise) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("❌ Demande de création de compte - Non acceptée");

            String content = String.format(
                    "Bonjour %s %s,\n\n" +
                            "Nous avons examiné votre demande pour l'entreprise **%s**.\n\n" +
                            "❌ Votre demande n'a pas pu être acceptée\n\n" +
                            "📌 Raison du refus :\n" +
                            "%s\n\n" +
                            "💡 Que faire ?\n" +
                            "Vous pouvez corriger les informations et soumettre une nouvelle demande à l'adresse :\n" +
                            "%s/demande\n\n" +
                            "Si vous pensez qu'il s'agit d'une erreur, vous pouvez nous contacter.\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    prenom, nom, nomEntreprise, raisonRejet, frontendUrl
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email de rejet envoyé à : {}", to);
        } catch (Exception e) {
            log.error("Erreur envoi email rejet à {} : {}", to, e.getMessage());
        }
    }

    /**
     * Email de bienvenue après activation du compte
     */
    public void sendBienvenueEmail(String to, String prenom, String nom) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🎉 Bienvenue sur Facturation !");

            String content = String.format(
                    "Bonjour %s %s,\n\n" +
                            "Votre compte est maintenant actif ! Bienvenue dans l'application.\n\n" +
                            "Vous pouvez dès maintenant :\n" +
                            "• Accéder à votre tableau de bord\n" +
                            "• Gérer votre entreprise\n" +
                            "• Créer vos premières factures\n\n" +
                            "Lien d'accès : %s/dashboard\n\n" +
                            "À bientôt,\n" +
                            "L'équipe Facturation",
                    prenom, nom, frontendUrl
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email de bienvenue envoyé à : {}", to);
        } catch (Exception e) {
            log.error("Erreur envoi email bienvenue à {} : {}", to, e.getMessage());
        }
    }

    /**
     * Email d'envoi d'un avoir au client (Note de crédit)
     *
     * @param to Email du client
     * @param numAvoir Numéro de l'avoir
     * @param numFacture Numéro de la facture source
     * @param montant Montant de l'avoir
     * @param type Type d'avoir (TOTAL/PARTIEL)
     * @param nomEntreprise Nom de l'entreprise émettrice
     */
    public void sendAvoirEmail(String to, String numAvoir, String numFacture,
                               String montant, String type, String nomEntreprise) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(String.format("Avoir n° %s - Note de crédit", numAvoir));

            String content = String.format(
                    "Bonjour,\n\n" +
                            "Veuillez trouver ci-joint l’avoir correspondant à l’annulation " +
                            "%s de votre facture n° %s.\n\n" +
                            "Montant : %s TND\n" +
                            "Type    : %s\n\n" +
                            "Ce montant vous sera remboursé sous 48h.\n\n" +
                            "Cordialement,\n" +
                            "%s",
                    type.equalsIgnoreCase("TOTAL") ? "totale" : "partielle",
                    numFacture, montant, type, nomEntreprise
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email d'avoir {} envoyé à : {}", numAvoir, to);
        } catch (Exception e) {
            log.error("Erreur envoi email avoir {} à {} : {}", numAvoir, to, e.getMessage());
        }
    }
}