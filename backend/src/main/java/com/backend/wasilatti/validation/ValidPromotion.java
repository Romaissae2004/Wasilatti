package com.backend.wasilatti.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = PromotionValidator.class)
@Target(ElementType.TYPE)  // ← applied on the class level
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPromotion {
    String message() default "Promotion percentage is required when inPromotion is true, and must be empty when false";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
