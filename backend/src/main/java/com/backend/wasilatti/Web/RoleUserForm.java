package com.backend.wasilatti.Web;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
/* @Data c'est les getters */
@Data
public class RoleUserForm {
    @NotBlank(message = "Nom d'utilisateur obligatoire")
    private String username;
    @NotBlank(message = "Nom du rôle obligatoire")
    private String roleName;
}
