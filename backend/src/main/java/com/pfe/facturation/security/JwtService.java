package com.pfe.facturation.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service pour la gestion des tokens JWT.
 *
 * Rôle :
 * - Générer des tokens JWT pour les utilisateurs authentifiés
 * - Valider les tokens JWT reçus dans les requêtes
 * - Extraire les informations du token (email, date d'expiration, etc.)
 * - Vérifier la signature et l'expiration des tokens
 */
@Service
public class JwtService {

    /**
     * Clé secrète pour signer les tokens (64 caractères en Base64 pour HS256)
     * Cette clé doit être gardée secrète et changée en production
     */
    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    /**
     * Extrait l'email (username) du token JWT
     * @param token Le token JWT
     * @return L'email de l'utilisateur
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrait une information spécifique du token JWT
     * @param token Le token JWT
     * @param claimsResolver Fonction qui extrait l'information désirée des claims
     * @return L'information extraite
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Génère un token JWT pour un utilisateur
     * @param userDetails Les détails de l'utilisateur
     * @return Le token JWT généré
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return generateToken(claims, userDetails);
    }

    /**
     * Génère un token JWT avec des claims supplémentaires
     * @param extraClaims Claims supplémentaires à ajouter au token
     * @param userDetails Les détails de l'utilisateur
     * @return Le token JWT généré
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)                     // Ajoute les claims supplémentaires
                .subject(userDetails.getUsername())      // Définit le sujet (email)
                .issuedAt(new Date(System.currentTimeMillis())) // Date de création
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // Expire dans 24h
                .signWith(getSignInKey())                // Signe avec la clé secrète
                .compact();                               // Génère le token final
    }

    /**
     * Vérifie si un token est valide pour un utilisateur
     * @param token Le token JWT à vérifier
     * @param userDetails Les détails de l'utilisateur
     * @return true si le token est valide, false sinon
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // Vérifie que l'email correspond et que le token n'est pas expiré
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    /**
     * Vérifie si le token est expiré
     * @param token Le token JWT
     * @return true si le token est expiré, false sinon
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extrait la date d'expiration du token
     * @param token Le token JWT
     * @return La date d'expiration
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extrait toutes les claims (informations) du token JWT
     * @param token Le token JWT
     * @return Les claims du token
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())               // Vérifie la signature avec la clé
                .build()
                .parseSignedClaims(token)                 // Parse le token signé
                .getPayload();                             // Récupère les claims
    }

    /**
     * Récupère la clé de signature à partir de la clé secrète
     * @return La clé de signature
     */
    private SecretKey getSignInKey() {
        // Décode la clé secrète de Base64 en bytes
        byte[] keyBytes = Base64.getDecoder().decode(SECRET_KEY);
        // Génère une clé HMAC-SHA à partir des bytes
        return Keys.hmacShaKeyFor(keyBytes);
    }
}