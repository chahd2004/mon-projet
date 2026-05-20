package com.pfe.facturation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class MatriculeFiscalValidator implements ConstraintValidator<MatriculeFiscalTunisie, String> {

    private static final Pattern MATRICULE_PATTERN = Pattern.compile(
            "^([0-9]{7})" +                      // 7 chiffres
                    "/([A-HJ-NP-TV-Z])" +        // Lettre sauf O,I,U
                    "/([APBDN])" +                // Code TVA
                    "/([MPCNE])" +                // Code catégorie
                    "/([0-9]{3})$"                // 3 chiffres
    );
    @Override
    public boolean isValid(String matricule, ConstraintValidatorContext context) {
        // Cas 1: Null ou vide
        if (matricule == null || matricule.isBlank()) {
            return false;
        }
        // Cas 2: Mauvais format
        matricule = matricule.trim().replaceAll("\\s+", ""); // Nettoie les espaces
        return MATRICULE_PATTERN.matcher(matricule).matches();
    }
}