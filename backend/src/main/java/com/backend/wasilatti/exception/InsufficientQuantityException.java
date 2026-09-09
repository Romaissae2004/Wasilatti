package com.backend.wasilatti.exception;

public class InsufficientQuantityException extends RuntimeException{

    public InsufficientQuantityException(String name) {
        super("Not enough quantity for " + name);
    }
}
