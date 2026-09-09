package com.backend.wasilatti.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintReplyDTO {

    @NotBlank(message = "La réponse est obligatoire")
    @Size(max = 2000, message = "La réponse ne doit pas dépasser 2000 caractères")
    private String adminResponse;
}
