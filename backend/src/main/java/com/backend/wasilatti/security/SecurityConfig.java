package com.backend.wasilatti.security;

import com.backend.wasilatti.service.AccountService;
import com.backend.wasilatti.service.TokenBlacklistService;
import com.backend.wasilatti.security.filtres.JwtAuthenticationFilter;
import com.backend.wasilatti.security.filtres.JwtAuthorizationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JWTUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AccountService accountService;

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService, OAuth2SuccessHandler oAuth2SuccessHandler, JWTUtil jwtUtil, PasswordEncoder passwordEncoder, AccountService accountService) {
        this.userDetailsService = userDetailsService;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.accountService = accountService;
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);
        authBuilder
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder);
        return authBuilder.build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthenticationManager authenticationManager, TokenBlacklistService tokenBlacklistService) throws Exception {
        http
                // On active le CORS en lui passant la configuration définie plus bas
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"erreur\": \"Accès refusé : vous n'avez pas les droits nécessaires\"}");
                        })
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"erreur\": \"Non authentifié : token manquant ou invalide\"}");
                        })
                )
                .headers(headers -> {
                    if ("dev".equals(activeProfile)) {
                        headers.frameOptions(frame -> frame.disable());
                    }
                })
                .authorizeHttpRequests(auth -> {
                    if ("dev".equals(activeProfile)) {
                        auth.requestMatchers("/h2-console/**").permitAll();
                    }
                    auth
                            .requestMatchers("/refreshToken/**", "/login/**", "/register/**", "/logout/**", "/forgot-password/**", "/reset-password/**", "/oauth2/**", "/login/oauth2/**", "/oauth2/token", "/auth/**").permitAll()
                            .requestMatchers(org.springframework.http.HttpMethod.GET, "/products/**", "/categories/**", "/collaborators/**", "/api/evaluations/public").permitAll()
                            .requestMatchers("/ws/**").permitAll()
                            .anyRequest().authenticated();
                })
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler))
                .addFilter(new JwtAuthenticationFilter(authenticationManager, jwtUtil, accountService))
                .addFilterBefore(new JwtAuthorizationFilter(tokenBlacklistService, jwtUtil), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Cette méthode s'aligne parfaitement avec ton CorsConfig.java pour éviter les conflits
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // On reprend les mêmes origines que ton CorsConfig.java
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000", "http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "X-Refresh-Token")); // Important pour que React puisse lire les tokens
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}