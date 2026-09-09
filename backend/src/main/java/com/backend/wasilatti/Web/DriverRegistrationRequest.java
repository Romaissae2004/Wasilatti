package com.backend.wasilatti.Web;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DriverRegistrationRequest {
    @NotBlank @Size(min = 3, max = 20)
    private String username;

    @NotBlank @Email
    private String email;

    @NotBlank
    @Pattern(
            regexp = "^(?!.*\\s)(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!*\\-_]).{8,255}$",
            message = "Mot de passe invalide"
    )
    private String password;

    @NotBlank private String firstName;
    @NotBlank private String lastName;
    @NotBlank private String cin;
    @NotBlank private String phone;
    private String adresse;
    private String vehicle; // "MOTO" | "VOITURE" | "VELO"
    private String zone;
}