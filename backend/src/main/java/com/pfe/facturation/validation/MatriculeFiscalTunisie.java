package com.pfe.facturation.validation;

import jakarta.validation.Constraint;
import java.lang.annotation.*;
import jakarta.validation.Payload;


@Target({ElementType.FIELD, ElementType.PARAMETER}) //Où peut-on l’utiliser?
@Retention(RetentionPolicy.RUNTIME)         //Elle reste disponible à l’exécution
@Constraint(validatedBy = MatriculeFiscalValidator.class) //Lien avec le validateur
@Documented
public @interface MatriculeFiscalTunisie {
    //Message d’erreur
    String message() default "Format de matricule fiscal tunisien invalide (doit être: 1234567/A/A/M/000)";
    //  groupes de validation
    Class<?>[] groups() default {};

    //  payload pour les métadonnées
    Class<? extends Payload>[] payload() default {};
}