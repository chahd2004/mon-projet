package com.pfe.facturation.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre JWT qui intercepte chaque requête HTTP pour vérifier et valider le token JWT.
 * Ce filtre s'exécute une fois par requête (OncePerRequestFilter) et ajoute l'utilisateur
 * authentifié dans le contexte de sécurité Spring Security si le token est valide.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    /**
     * Constructeur avec injection des dépendances
     * @param jwtService Service pour la gestion des tokens JWT
     * @param userDetailsService Service pour charger les détails de l'utilisateur
     */
    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Méthode principale du filtre qui traite chaque requête HTTP
     * @param request La requête HTTP
     * @param response La réponse HTTP
     * @param filterChain La chaîne de filtres
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Récupérer le chemin de la requête pour identifier les routes publiques
        String path = request.getServletPath();
        System.out.println("=== DEBOGAGE JWT FILTER ===");
        System.out.println("Requete sur: " + path);

        // 2. Laisser passer les routes publiques sans vérification de token
        if (path.equals("/api/auth/login") ||
                path.equals("/api/auth/register") ||
                path.startsWith("/api/public/") ||
                path.startsWith("/api/test/")) {
            System.out.println("Route publique, laisse passer");
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Récupérer le header Authorization qui contient le token JWT
        final String authHeader = request.getHeader("Authorization");
        System.out.println("Auth Header present: " + (authHeader != null));

        if (authHeader != null) {
            System.out.println("Auth Header starts with Bearer: " + authHeader.startsWith("Bearer "));
            System.out.println("Auth Header length: " + authHeader.length());
        }

        // 4. Vérifier la présence et le format du token (doit commencer par "Bearer ")
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Pas de token Bearer valide");
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Extraire le token JWT (supprimer "Bearer " du début)
        final String jwt = authHeader.substring(7);
        System.out.println("Token extrait: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");

        // 6. Extraire l'email (username) du token
        final String userEmail;

        try {
            userEmail = jwtService.extractUsername(jwt);
            System.out.println("Email extrait du token: " + userEmail);
        } catch (Exception e) {
            System.out.println("Erreur extraction token: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token JWT invalide");
            return;
        }

        // 7. Si l'email est extrait et que l'utilisateur n'est pas déjà authentifié
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 8. Charger les détails de l'utilisateur depuis la base de données
            System.out.println("Chargement de l'utilisateur: " + userEmail);
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            System.out.println("Utilisateur charge: " + (userDetails != null));

            // 9. Valider le token JWT
            if (jwtService.isTokenValid(jwt, userDetails)) {
                System.out.println("Token valide");

                // 10. Créer un objet d'authentification Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                // 11. Ajouter les détails de la requête (IP, session, etc.)
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 12. Mettre l'authentification dans le contexte de sécurité
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("Authentification reussie pour: " + userEmail);
            } else {
                System.out.println("Token invalide");
            }
        }

        // 13. Continuer la chaîne de filtres
        filterChain.doFilter(request, response);
    }
}