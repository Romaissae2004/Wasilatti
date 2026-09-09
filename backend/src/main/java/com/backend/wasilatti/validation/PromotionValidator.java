package com.backend.wasilatti.validation;


import com.backend.wasilatti.model.entity.Product;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PromotionValidator implements ConstraintValidator<ValidPromotion, Product> {

    @Override
    public boolean isValid(Product product, ConstraintValidatorContext context) {
        if (product == null) return true;

        if (product.isInPromotion()) {
            // inPromotion=true → promotionPercentage must be > 0
            return product.getPromotionPercentage() > 0;
        } else {
            // inPromotion=false → promotionPercentage must be 0 (not set)
            return product.getPromotionPercentage() == 0;
        }
    }
}
