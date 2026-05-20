package com.pfe.facturation.exception;

/**
 * Exception levée lorsqu'une ressource n'est pas trouvée.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
