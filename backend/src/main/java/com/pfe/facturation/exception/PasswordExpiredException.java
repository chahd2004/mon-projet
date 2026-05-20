package com.pfe.facturation.exception;

public class PasswordExpiredException extends RuntimeException {
    public PasswordExpiredException(String message) {
        super(message);
    }
}