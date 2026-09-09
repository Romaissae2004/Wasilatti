package com.backend.wasilatti.exception;

public class ImageNotBelongsToProductException extends RuntimeException{
    public ImageNotBelongsToProductException(String message){
        super(message);
    }
}
