package com.pfe.facturation.service;

import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour générer des mots de passe sécurisés
 */
@Component
public class PasswordGeneratorService {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;

    private static final int PASSWORD_LENGTH = 12;
    private final SecureRandom random = new SecureRandom();

    /**
     * Génère un mot de passe sécurisé (12 caractères)
     */
    public String generateSecurePassword() {
        return generateSecurePassword(PASSWORD_LENGTH);
    }

    /**
     * Génère un mot de passe sécurisé avec longueur personnalisée
     * @param length Longueur souhaitée (minimum 8)
     */
    public String generateSecurePassword(int length) {
        if (length < 8) {
            throw new IllegalArgumentException("La longueur minimale est 8 caractères");
        }

        StringBuilder password = new StringBuilder();

        // Garantir au moins un caractère de chaque type
        password.append(getRandomChar(UPPER));
        password.append(getRandomChar(LOWER));
        password.append(getRandomChar(DIGITS));
        password.append(getRandomChar(SPECIAL));

        // Compléter avec des caractères aléatoires
        for (int i = password.length(); i < length; i++) {
            password.append(getRandomChar(ALL_CHARS));
        }

        // Mélanger le mot de passe
        return shuffleString(password.toString());
    }

    /**
     * Génère un mot de passe plus lisible (sans caractères ambigus)
     */
    public String generateReadablePassword() {
        String noAmbiguous = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 8; i++) {
            password.append(noAmbiguous.charAt(random.nextInt(noAmbiguous.length())));
        }

        // Ajouter un chiffre et un spécial à des positions aléatoires
        password.insert(random.nextInt(password.length()), random.nextInt(10));
        password.insert(random.nextInt(password.length()), SPECIAL.charAt(random.nextInt(SPECIAL.length())));

        return password.toString();
    }

    private char getRandomChar(String characters) {
        return characters.charAt(random.nextInt(characters.length()));
    }

    private String shuffleString(String input) {
        List<Character> chars = input.chars()
                .mapToObj(c -> (char) c)
                .collect(Collectors.toList());
        Collections.shuffle(chars, random);

        return chars.stream()
                .map(String::valueOf)
                .collect(Collectors.joining());
    }
}