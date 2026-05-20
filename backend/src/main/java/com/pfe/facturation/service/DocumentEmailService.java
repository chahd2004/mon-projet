package com.pfe.facturation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * EMAIL 1 — Devis
     * Envoyé quand le devis passe en SENT
     * Le client peut accepter ou rejeter
     */
    public void sendDevisEmail(String to, String nomClient,
                               String numeroDevis, String montantTotal) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("📄 Devis n°" + numeroDevis + " — En attente de votre réponse");

            String content = String.format(
                    "Bonjour %s,\n\n" +
                            "Veuillez trouver ci-joint votre devis n°%s.\n\n" +
                            "💰 Montant total : %s\n\n" +
                            "Pour consulter et répondre à ce devis :\n" +
                            "%s/devis/%s\n\n" +
                            "Vous pouvez :\n" +
                            "• ✅ Accepter le devis\n" +
                            "• ❌ Rejeter le devis\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    nomClient, numeroDevis, montantTotal, frontendUrl, numeroDevis
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email devis envoyé à : {} pour devis n°{}", to, numeroDevis);
        } catch (Exception e) {
            log.error("Erreur envoi email devis à {} : {}", to, e.getMessage());
        }
    }

    /**
     * EMAIL 1-Accepted — Devis Accepté
     * Envoyé au vendeur quand le client accepte le devis
     */
    public void sendDevisAcceptedEmail(String to, String nomVendeur, String nomClient, String numeroDevis) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("✅ Devis Accepté — n°" + numeroDevis);

            String content = String.format(
                    "Bonjour %s,\n\n" +
                            "Bonne nouvelle ! Le client %s a accepté votre devis n°%s.\n\n" +
                            "Vous pouvez maintenant générer le bon de commande correspondant depuis votre tableau de bord.\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    nomVendeur, nomClient, numeroDevis
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email acceptation devis envoyé à : {} pour devis n°{}", to, numeroDevis);
        } catch (Exception e) {
            log.error("Erreur envoi email acceptation devis à {} : {}", to, e.getMessage());
        }
    }

    /**
     * EMAIL 1-Rejected — Devis Rejeté
     * Envoyé au vendeur quand le client rejette le devis
     */
    public void sendDevisRejectedEmail(String to, String nomVendeur, String nomClient, String numeroDevis, String raison) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("❌ Devis Rejeté — n°" + numeroDevis);

            String content = String.format(
                    "Bonjour %s,\n\n" +
                            "Le client %s a rejeté votre devis n°%s.\n\n" +
                            "Raison du rejet : %s\n\n" +
                            "Vous pouvez modifier le devis ou contacter le client pour plus d'informations.\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    nomVendeur, nomClient, numeroDevis, raison
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email rejet devis envoyé à : {} pour devis n°{}", to, numeroDevis);
        } catch (Exception e) {
            log.error("Erreur envoi email rejet devis à {} : {}", to, e.getMessage());
        }
    }

    /**
     * EMAIL 2 — Bon de commande
     * Envoyé quand le bon de commande passe en SENT
     * Le client doit signer (SIGNED_CLIENT)
     */
    public void sendBonCommandeEmail(String to, String nomClient,
                                     String numeroBonCommande, String montantTotal) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🖊️ Bon de commande n°" + numeroBonCommande + " — Signature requise");

            String content = String.format(
                    "Bonjour %s,\n\n" +
                            "Votre bon de commande n°%s est prêt et nécessite votre signature.\n\n" +
                            "💰 Montant total : %s\n\n" +
                            "Pour consulter et signer ce bon de commande :\n" +
                            "%s/bon-commande/%s\n\n" +
                            "⚠️ Votre signature est requise pour confirmer la commande.\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    nomClient, numeroBonCommande, montantTotal, frontendUrl, numeroBonCommande
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email bon de commande envoyé à : {} pour BC n°{}", to, numeroBonCommande);
        } catch (Exception e) {
            log.error("Erreur envoi email bon de commande à {} : {}", to, e.getMessage());
        }
    }

    /**
     * EMAIL 3 — Bon de livraison
     * Envoyé quand le bon de livraison passe en DELIVERED
     * Le client doit signer (SIGNED_CLIENT)
     */
    public void sendBonLivraisonEmail(String to, String nomClient,
                                      String numeroBonLivraison, String numeroCommande) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("🚚 Bon de livraison n°" + numeroBonLivraison + " — Signature de réception requise");

            String content = String.format(
                    "Bonjour %s,\n\n" +
                            "Votre livraison pour la commande n°%s a été effectuée.\n\n" +
                            "📦 Bon de livraison n°%s\n\n" +
                            "Pour confirmer la réception et signer :\n" +
                            "%s/bon-livraison-signature/%s\n\n" +
                            "⚠️ Votre signature confirme la bonne réception de la livraison.\n" +
                            "En cas de problème, vous pourrez ouvrir un litige depuis ce lien.\n\n" +
                            "Cordialement,\n" +
                            "L'équipe Facturation",
                    nomClient, numeroCommande, numeroBonLivraison, frontendUrl, numeroBonLivraison
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Email bon de livraison envoyé à : {} pour BL n°{}", to, numeroBonLivraison);
        } catch (Exception e) {
            log.error("Erreur envoi email bon de livraison à {} : {}", to, e.getMessage());
        }
    }
}