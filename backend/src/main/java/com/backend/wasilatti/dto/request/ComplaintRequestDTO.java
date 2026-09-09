package com.backend.wasilatti.dto.request;

import com.backend.wasilatti.model.enums.ComplaintSeverity;
import com.backend.wasilatti.model.enums.ComplaintType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequestDTO {

    @NotNull(message = "Le type de plainte est obligatoire")
    private ComplaintType type;

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(max = 120, message = "Le sujet ne doit pas dépasser 120 caractères")
    private String subject;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 20, max = 2000, message = "La description doit contenir entre 20 et 2000 caractères")
    private String description;

    @NotNull(message = "La priorité est obligatoire")
    private ComplaintSeverity severity;

    private Long orderId;
}
