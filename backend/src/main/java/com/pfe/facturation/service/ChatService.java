package com.pfe.facturation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.*;

@Service
public class ChatService {

    // ═══════════════════════════════════════════════════════
    // CONSTANTES — calibrées pour llama-3.1-8b-instant (Groq)
    // Context window : 128k tokens | Max output : 8 192 tokens
    // ═══════════════════════════════════════════════════════
    private static final int MAX_TOKENS_SQL       = 1024;
    private static final int MAX_TOKENS_RESPONSE  = 1500;

    // 8 000 tokens ≈ ~32 000 caractères ≈ 200-400 lignes typiques
    // Au-delà, on retourne un message convivial plutôt que des données tronquées
    private static final int TOKEN_BUDGET_RESULTS = 8_000;
    private static final int CHARS_PER_TOKEN      = 4;

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.model}")
    private String model;

    @Autowired
    private EntityManager entityManager;

    private final RestTemplate restTemplate = new RestTemplate();

    // ═══════════════════════════════════════════════════════
    // UTILITAIRE : estimation du nombre de tokens
    // ═══════════════════════════════════════════════════════
    private int estimateTokens(String text) {
        if (text == null) return 0;
        return (int) Math.ceil((double) text.length() / CHARS_PER_TOKEN);
    }

    // ═══════════════════════════════════════════════════════
    // POINT D'ENTRÉE PRINCIPAL
    // ═══════════════════════════════════════════════════════
    public String getGroqResponse(String userMessage, Long entrepriseId) {
        if (entrepriseId == null) {
            return "Erreur : impossible d'identifier votre entreprise.";
        }

        try {
            String detectedLang = detectLanguage(userMessage);
            String generatedSQL = generateSQL(userMessage, entrepriseId);

            System.out.println("\n===== SQL GÉNÉRÉ =====\n" + generatedSQL + "\n======================\n");

            if (!isSafeSQL(generatedSQL)) {
                return detectedLang.equals("English")
                        ? "Sorry, this request is not allowed for security reasons."
                        : "Désolé, cette requête n'est pas autorisée pour des raisons de sécurité.";
            }

            String queryResult = executeSQL(generatedSQL, detectedLang);
            System.out.println("\n===== RÉSULTAT SQL =====\n" + queryResult + "\n========================\n");

            // Si le résultat est un message convivial (trop de données), on le retourne directement
            // sans passer par le LLM — inutile de lui envoyer un message qu'il va juste reformuler
            if (queryResult.startsWith("TOO_MANY_DATA:")) {
                return queryResult.substring("TOO_MANY_DATA:".length());
            }

            return generateFinalResponse(userMessage, queryResult, detectedLang);

        } catch (Exception e) {
            System.err.println("Erreur ChatService: " + e.getMessage());
            return "Désolé, une erreur est survenue. Veuillez reformuler votre question.";
        }
    }

    // ═══════════════════════════════════════════════════════
    // GÉNÉRATION SQL (IA COMPLÈTEMENT AUTONOME)
    // ═══════════════════════════════════════════════════════
    private String generateSQL(String userMessage, Long entrepriseId) {
        String systemPrompt = String.format("""
            You are an expert PostgreSQL database administrator for an invoicing system.
            Your ONLY job is to output a single, raw, valid PostgreSQL query that answers the user's question.
            NO markdown, NO explanations, NO quotes. Just return the SQL code so it can be executed.

            ════════════════════════════════════════════
            DATABASE SCHEMA & JOINS
            ════════════════════════════════════════════
            TABLES:
            - factures(id, num_fact, acheteur_client_id, nom_acheteur, total_ht, montant_tva, totalttc, statut, date_emission, date_paiement, vendeur_id)
            - ligne_facture(id, facture_id, produit_id, quantite, prix_unitaire)
            - clients(id, raison_sociale, email, telephone, emetteur_id)
            - produits(id, designation, reference, prix_unitaire, emetteur_id)
            
            JOIN CONDITIONS:
            - factures to clients: factures.acheteur_client_id = clients.id
            - ligne_facture to factures: ligne_facture.facture_id = factures.id
            - ligne_facture to produits: ligne_facture.produit_id = produits.id

            ════════════════════════════════════════════
            BUSINESS RULES & SAFETY
            ════════════════════════════════════════════
            1. "Chiffre d'affaires" (CA) or "Revenue": SUM(totalttc) of factures where statut = 'PAID'.
            2. "Impayées" or "En retard": factures where statut = 'SENT'.
            3. "Brouillon": factures where statut = 'DRAFT'.
            4. "Signée" (or typos like "singée"): factures where statut = 'SIGNED'.
            5. "Annulée": factures where statut = 'CANCELLED'.
            6. "Rejetée": factures where statut = 'REJECTED'.
            7. "Toutes" or "All": COUNT(*) regardless of status.
            8. Lists/Tables: Always add LIMIT 100 to prevent huge queries.
            9. Monthly Evolution: use TO_CHAR(date_emission, 'YYYY-MM') as month, group by it, and ORDER BY month ASC.
            10. Top Products: Join ligne_facture, factures and produits, group by produits.designation, sum the quantity.
            11. Ignore requests about devis / bons de commande (return SELECT 'OUT_OF_SCOPE';).
            12. SECURITY: ALWAYS RETURN READ-ONLY QUERIES (SELECT). NEVER generate UPDATE, DELETE, INSERT, DROP.

            ════════════════════════════════════════════
            CRITICAL SECURITY FILTER
            ════════════════════════════════════════════
            Every query MUST be filtered for the current company (Id = %d) to prevent data leaks:
            - factures: WHERE vendeur_id = %d
            - clients: WHERE emetteur_id = %d
            - produits: WHERE emetteur_id = %d

            ════════════════════════════════════════════
            EXAMPLES
            ════════════════════════════════════════════
            Q: Combien de factures j'ai ?
            A: SELECT COUNT(*) FROM factures WHERE vendeur_id = %d;
            
            Q: Liste mes factures impayées
            A: SELECT num_fact, nom_acheteur, totalttc, date_paiement FROM factures WHERE vendeur_id = %d AND statut = 'SENT' LIMIT 10;
            
            Q: Quel est le CA par client ?
            A: SELECT nom_acheteur, SUM(totalttc) as ca FROM factures WHERE vendeur_id = %d AND statut = 'PAID' GROUP BY nom_acheteur ORDER BY ca DESC LIMIT 10;
            
            Q: Quel produit est le plus vendu ?
            A: SELECT p.designation, SUM(lf.quantite) as total_vendus, SUM(lf.quantite * lf.prix_unitaire) as revenu FROM ligne_facture lf JOIN factures f ON lf.facture_id = f.id JOIN produits p ON lf.produit_id = p.id WHERE f.vendeur_id = %d AND f.statut = 'PAID' GROUP BY p.designation ORDER BY total_vendus DESC LIMIT 1;
            
            Q: Évolution du CA sur 6 mois ?
            A: SELECT TO_CHAR(date_emission, 'YYYY-MM') as mois, SUM(totalttc) as ca_mensuel FROM factures WHERE vendeur_id = %d AND statut = 'PAID' AND date_emission >= CURRENT_DATE - INTERVAL '6 months' GROUP BY mois ORDER BY mois ASC;
            """,
                entrepriseId, entrepriseId, entrepriseId, entrepriseId,
                entrepriseId, entrepriseId, entrepriseId, entrepriseId, entrepriseId
        );

        String sql = callGroq(systemPrompt, "Question: " + userMessage, MAX_TOKENS_SQL);

        return sql.replaceAll("(?i)```sql", "")
                .replaceAll("(?i)```", "")
                .replaceAll("`", "")
                .replaceAll(";", "")
                .trim();
    }

    // ═══════════════════════════════════════════════════════
    // EXÉCUTION SQL — troncature basée sur le budget de tokens
    // ═══════════════════════════════════════════════════════
    private String executeSQL(String sql, String detectedLang) {
        try {
            if (sql.contains("OUT_OF_SCOPE")) {
                return "OUT_OF_SCOPE";
            }

            Query query = entityManager.createNativeQuery(sql);
            List results = query.getResultList();

            if (results == null || results.isEmpty()) {
                return "NO_RESULTS";
            }

            String upperSql = sql.toUpperCase();
            boolean isAggregate = upperSql.matches(".*\\b(COUNT|SUM|AVG|MIN|MAX)\\b.*");
            int resultCount = results.size();

            // ── CAS 1 : agrégation unique ──────────────────────────────
            if (isAggregate && resultCount == 1) {
                Object firstRow = results.get(0);
                String value;
                if (firstRow instanceof Object[]) {
                    Object[] arr = (Object[]) firstRow;
                    if (arr.length == 1) {
                        value = arr[0] != null ? arr[0].toString() : "0";
                    } else {
                        StringBuilder multiValue = new StringBuilder();
                        for (int i = 0; i < arr.length; i++) {
                            if (i > 0) multiValue.append("|");
                            multiValue.append(arr[i] != null ? arr[i].toString() : "0");
                        }
                        value = multiValue.toString();
                    }
                } else {
                    value = firstRow != null ? firstRow.toString() : "0";
                }
                return "RESULT_VALUE:" + value;
            }

            // ── CAS 2 : liste — on accumule les lignes jusqu'au budget ──
            StringBuilder sb = new StringBuilder();
            String header = "QUERY_RESULTS (" + resultCount + " total rows):\n";
            sb.append(header);

            int rowsIncluded = 0;
            int budgetUsed   = estimateTokens(header);

            for (Object row : results) {
                StringBuilder line = new StringBuilder("- ");
                if (row instanceof Object[]) {
                    for (Object col : (Object[]) row) {
                        String val = col != null ? col.toString() : "N/A";
                        if (val.length() > 200) val = val.substring(0, 197) + "...";
                        line.append(val).append(" | ");
                    }
                } else {
                    String val = row != null ? row.toString() : "N/A";
                    if (val.length() > 200) val = val.substring(0, 197) + "...";
                    line.append(val);
                }
                line.append("\n");

                int lineTokens = estimateTokens(line.toString());

                // ── Budget dépassé → message convivial direct à l'utilisateur ──
                if (budgetUsed + lineTokens > TOKEN_BUDGET_RESULTS) {
                    int remaining = resultCount - rowsIncluded;
                    if (detectedLang.equals("English")) {
                        return "TOO_MANY_DATA:Your request returned **" + resultCount + " results**, which is too large to display here (" + remaining + " rows could not be shown).\n\n"
                                + "💡 **Try refining your search:**\n"
                                + "- Filter by a specific period (e.g. *invoices from January 2024*)\n"
                                + "- Filter by client name\n"
                                + "- Filter by status (paid, unpaid, draft…)\n"
                                + "- Ask for a summary instead (e.g. *total amount of unpaid invoices*)";
                    } else {
                        return "TOO_MANY_DATA:Votre demande a retourné **" + resultCount + " résultats**, ce qui est trop volumineux pour être affiché ici (" + remaining + " lignes n'ont pas pu être affichées).\n\n"
                                + "💡 **Essayez d'affiner votre recherche :**\n"
                                + "- Filtrer par période (ex. *factures de janvier 2024*)\n"
                                + "- Filtrer par nom de client\n"
                                + "- Filtrer par statut (payées, impayées, brouillons…)\n"
                                + "- Demander un résumé (ex. *montant total des factures impayées*)";
                    }
                }

                sb.append(line);
                budgetUsed += lineTokens;
                rowsIncluded++;
            }

            return sb.toString();

        } catch (Exception e) {
            System.err.println("SQL Error: " + e.getMessage());
            System.err.println("SQL executed: " + sql);
            return "SQL_FAILED";
        }
    }

    // ═══════════════════════════════════════════════════════
    // GÉNÉRATION DE LA RÉPONSE FINALE
    // ═══════════════════════════════════════════════════════
    private String generateFinalResponse(String userMessage, String queryResult, String lang) {
        int tokens = MAX_TOKENS_RESPONSE;
        if (queryResult != null && queryResult.startsWith("RESULT_VALUE:")) tokens = 500;

        String systemPrompt = String.format("""
            You are a professional billing assistant. Respond ONLY in %s.

            ════════════════════════════════════════════
            FORMATTING RULES
            ════════════════════════════════════════════
            - Never show SQL, table names, or technical column names to the user.
            - If it's a list of rows, use clean bullet points (-).
            - For financial amounts, format clearly with spaces (e.g., 12 500 TND).
            - If it's a monthly evolution, analyze the numbers and add trends (↑ or ↓).
            - Note: "OUT_OF_SCOPE" means "I only handle invoices and credit notes. Please ask about invoicing."
            - Note: "NO_RESULTS" means "No data found for your request."
            - Note: "SQL_FAILED" means "I couldn't process this request. Try simpler questions."
            - Always structure your response so it's directly readable by an executive in pure text.

            Based on the following pure raw database SQL output, construct a polite, clear, and perfectly formatted answer responding directly to the user's initial request.
            """, lang);

        String userPrompt = String.format("Request: %s\nDatabase Raw Output: %s", userMessage, queryResult);

        return callGroq(systemPrompt, userPrompt, tokens);
    }

    // ═══════════════════════════════════════════════════════
    // SÉCURITÉ SQL
    // ═══════════════════════════════════════════════════════
    private boolean isSafeSQL(String sql) {
        if (sql == null || sql.isBlank()) return false;

        String upper = sql.trim().toUpperCase();

        if (!upper.startsWith("SELECT")) {
            System.err.println("Security: Not a SELECT query");
            return false;
        }

        String[] forbidden = {
                ";", "DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE",
                "ALTER", "CREATE", "EXEC", "EXECUTE", "INFORMATION_SCHEMA",
                "PG_", "--", "/*", "*/", "INTO", "FILE"
        };

        for (String keyword : forbidden) {
            if (upper.contains(keyword)) {
                System.err.println("Security: Forbidden keyword: " + keyword);
                return false;
            }
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════
    // DÉTECTION DE LANGUE
    // ═══════════════════════════════════════════════════════
    private String detectLanguage(String text) {
        if (text == null || text.isBlank()) return "English";

        if (text.matches(".*[àâäéèêëîïôùûüçœæÀÂÄÉÈÊËÎÏÔÙÛÜÇŒÆ].*")) {
            return "French";
        }

        String lower = text.toLowerCase();

        String[] frenchWords = {
                "combien", "quel", "quelle", "quels", "quelles", "affiche", "montre",
                "liste", "donne", "trouve", "facture", "factures", "avoir", "avoirs",
                "client", "clients", "chiffre", "montant", "dernier", "derniere",
                "payee", "payees", "brouillon", "annule", "entreprise", "mois", "annee"
        };

        for (String word : frenchWords) {
            if (lower.contains(word)) {
                return "French";
            }
        }

        return "English";
    }

    // ═══════════════════════════════════════════════════════
    // APPEL API GROQ
    // ═══════════════════════════════════════════════════════
    private String callGroq(String systemPrompt, String userPrompt, int maxTokens) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "max_tokens", maxTokens,
                "temperature", 0.1
        );

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.groq.com/openai/v1/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    Map.class
            );

            Map responseBody = response.getBody();
            if (responseBody == null) return "Erreur technique. Veuillez réessayer.";

            List<Map> choices = (List<Map>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) return "Erreur technique. Veuillez réessayer.";

            return (String) ((Map) choices.get(0).get("message")).get("content");

        } catch (Exception e) {
            System.err.println("API Error: " + e.getMessage());
            return "Erreur de communication. Veuillez réessayer plus tard.";
        }
    }
}