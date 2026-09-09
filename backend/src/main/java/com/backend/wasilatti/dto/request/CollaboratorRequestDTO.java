package com.backend.wasilatti.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CollaboratorRequestDTO {

    @NotBlank(message = "Collaborator name cannot be empty")
    private String name;

    private String username;
    private String email;
    private String password;
    private String phoneNumber;
}