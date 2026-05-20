# Corriger « Accès refusé : droits insuffisants » (403)

## Problème

Sur les pages **Clients**, **Factures**, **Produits**, l’application affiche :  
**« Accès refusé : droits insuffisants »**.  
Le backend renvoie **HTTP 403** car le rôle de l’utilisateur connecté n’a pas le droit d’accéder à ces endpoints.

## Solution côté backend (Spring Security)

Il faut autoriser les rôles adéquats sur les URLs utilisées par le frontend.

### 1. Exemple avec `SecurityFilterChain` (Spring Security 6)

Dans votre classe de configuration (ex. `SecurityConfig`), autorisez au moins les rôles **ADMIN** et **EMETTEUR** (ou **USER**) sur les API métier :

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // ou configurer CSRF si besoin
            .authorizeHttpRequests(auth -> auth
                // Endpoints publics
                .requestMatchers("/api/auth/**").permitAll()
                // Clients : lecture/crud pour les rôles ayant besoin de gérer les clients
                .requestMatchers(HttpMethod.GET, "/api/clients").hasAnyRole("ADMIN", "EMETTEUR", "USER")
                .requestMatchers("/api/clients/**").hasAnyRole("ADMIN", "EMETTEUR", "USER")
                // Produits
                .requestMatchers(HttpMethod.GET, "/api/produits").hasAnyRole("ADMIN", "EMETTEUR", "USER")
                .requestMatchers("/api/produits/**").hasAnyRole("ADMIN", "EMETTEUR", "USER")
                // Factures
                .requestMatchers(HttpMethod.GET, "/api/factures").hasAnyRole("ADMIN", "EMETTEUR", "USER")
                .requestMatchers("/api/factures/**").hasAnyRole("ADMIN", "EMETTEUR", "USER")
                // Dashboard / autres API
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));  // si JWT
        return http.build();
    }
}
```

Adaptez les noms de rôles (`ADMIN`, `EMETTEUR`, `USER`) à votre enum `Role` (sans le préfixe `ROLE_` dans `hasAnyRole`, Spring l’ajoute souvent tout seul).

### 2. Vérifier le rôle de l’utilisateur connecté

- Vérifier en base ou dans les logs quel **role** a l’utilisateur avec lequel vous vous connectez.
- S’il a par exemple `EMETTEUR` ou `USER`, les `requestMatchers` ci‑dessus doivent inclure ce rôle pour `GET /api/clients`, `GET /api/produits`, `GET /api/factures`.

### 3. Si vous utilisez des annotations sur les controllers

Assurez‑vous que les méthodes sont accessibles au bon rôle, par exemple :

```java
@GetMapping("/api/clients")
@PreAuthorize("hasAnyRole('ADMIN', 'EMETTEUR', 'USER')")
public ResponseEntity<List<Client>> getClients() { ... }
```

Après modification, redémarrer le backend et se reconnecter au frontend pour tester.
