package com.backend.wasilatti.dto.request;

import com.backend.wasilatti.model.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintStatusUpdateDTO {

    @NotNull(message = "Le statut est obligatoire")
    private ComplaintStatus status;
}
