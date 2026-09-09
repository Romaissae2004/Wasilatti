package com.backend.wasilatti.dto.response;

import java.time.Instant;

//to create a common return format, which only changes the data attribute
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private final Instant timestamp = Instant.now();
    private T data;

    public ApiResponse(boolean success, String message) {
        this.message = message;
        this.success = success;
    }

    public ApiResponse(boolean success, String message, T data) {
        this.message = message;
        this.success = success;
        this.data = data;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }


}