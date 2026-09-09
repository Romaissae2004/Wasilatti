package com.backend.wasilatti.Web;

import lombok.Data;

@Data
public class DriverUpdateRequest {
    private String firstName;
    private String lastName;
    private String cin;
    private String phone;
    private String email;
    private String adresse;
    private String vehicle;
    private String zone;
}