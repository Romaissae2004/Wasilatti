package com.backend.wasilatti.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequestDTO {
    private String name;
    private String description;
    private Long collaboratorId;
}
