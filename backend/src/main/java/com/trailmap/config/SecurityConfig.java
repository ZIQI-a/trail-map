package com.trailmap.config;

import com.trailmap.security.BearerTokenAuthenticationFilter;
import com.trailmap.security.SecurityExceptionHandlers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 配置，当前采用无状态 Bearer Token 模式保护管理员接口。
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final BearerTokenAuthenticationFilter bearerTokenAuthenticationFilter;
    private final SecurityExceptionHandlers securityExceptionHandlers;

    public SecurityConfig(
            BearerTokenAuthenticationFilter bearerTokenAuthenticationFilter,
            SecurityExceptionHandlers securityExceptionHandlers) {
        this.bearerTokenAuthenticationFilter = bearerTokenAuthenticationFilter;
        this.securityExceptionHandlers = securityExceptionHandlers;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(securityExceptionHandlers)
                        .accessDeniedHandler(securityExceptionHandlers))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/public-trips/**",
                                "/api/health",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**")
                        .permitAll()
                        .requestMatchers("/api/auth/me")
                        .authenticated()
                        .requestMatchers("/api/favorite-spots/**")
                        .authenticated()
                        .requestMatchers("/api/checkin-spots/**")
                        .authenticated()
                        .requestMatchers("/api/user-trips/**")
                        .authenticated()
                        .requestMatchers("/api/profile/**")
                        .authenticated()
                        .requestMatchers("/api/users/**")
                        .hasRole("ADMIN")
                        .anyRequest()
                        .permitAll())
                .addFilterBefore(
                        bearerTokenAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .cors(Customizer.withDefaults())
                .build();
    }

    /**
     * 当前项目不使用 Spring Security 默认用户名密码登录，显式提供空 UserDetailsService 避免生成默认账号。
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UnsupportedOperationException("TrailMap 当前不使用默认用户名密码认证");
        };
    }
}
