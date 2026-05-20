package com.pfe.facturation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@SpringBootApplication
public class FacturationApplication {

	public static void main(String[] args) {
		SpringApplication.run(FacturationApplication.class, args);
		// Message de bienvenue dans la console
		System.out.println("\n" +
				"╔════════════════════════════════════════════════════════╗\n" +
				"║                                                        ║\n" +
				"║   Application de Facturation PFE démarrée avec succès! ║\n" +
				"║   🌐 http://localhost:8080                             ║\n" +
				"║   📧 Serveur email configuré                           ║\n" +
				"║   🔐 Sécurité JWT activée                              ║\n" +
				"║                                                        ║\n" +
				"╚════════════════════════════════════════════════════════╝\n");
	}

	// Configuration CORS plus robuste pour GitHub/DevTools
	@Bean
	public CorsFilter corsFilter() {
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		CorsConfiguration config = new CorsConfiguration();
		
		config.setAllowCredentials(true);
		config.addAllowedOrigin("http://localhost:4200");
		config.addAllowedHeader("*");
		config.addAllowedMethod("*");
		
		source.registerCorsConfiguration("/**", config);
		return new CorsFilter(source);
	}
}