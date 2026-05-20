# Correction Backend Spring Boot - Erreur 500 sur Login

## Problème
L'erreur HTTP 500 sur `/api/auth/login` est causée par des champs **null** dans la base de données :
- `type_user` = null pour tous les utilisateurs
- `telephone` = null pour certains utilisateurs

Le backend plante probablement lors de la construction de `AuthResponse`.

## Corrections à appliquer dans votre projet Spring Boot

### 1. AuthResponse (DTO) - Gérer les null
```java
public class AuthResponse {
    private String token;
    private String type;
    private Long id;
    private String email;
    private String role;
    private String typeUser;  // peut être null
    private String nom;
    private String prenom;    // peut être null
    private String telephone; // peut être null
    
    // Utilisez des valeurs par défaut si null
    public static AuthResponse from(User user, String token) {
        AuthResponse r = new AuthResponse();
        r.setToken(token);
        r.setId(user.getId());
        r.setEmail(user.getEmail());
        r.setRole(user.getRole() != null ? user.getRole().name() : "USER");
        r.setTypeUser(user.getTypeUser() != null ? user.getTypeUser().name() : null);
        r.setNom(user.getNom() != null ? user.getNom() : "");
        r.setPrenom(user.getPrenom());  // null accepté
        r.setTelephone(user.getTelephone());  // null accepté
        return r;
    }
}
```

### 2. AuthServiceImpl - Vérifier les null avant mapping
Dans la méthode `login()`, assurez-vous de ne jamais appeler de méthode sur un objet null :
```java
AuthResponse response = AuthResponse.builder()
    .token(token)
    .id(user.getId())
    .email(user.getEmail())
    .role(user.getRole() != null ? user.getRole().name() : "USER")
    .typeUser(user.getTypeUser() != null ? user.getTypeUser().name() : null)
    .nom(user.getNom() != null ? user.getNom() : "")
    .prenom(user.getPrenom())      // OK si null
    .telephone(user.getTelephone()) // OK si null
    .build();
```

### 3. UserRepository - findByEmail
Vérifiez que la requête utilise bien `email` (et non `username`) :
```java
Optional<User> findByEmail(String email);
```

### 4. LoginRequest - Champs attendus
Le frontend envoie :
```json
{ "email": "...", "password": "..." }
```
Le backend doit accepter `email` et `password` (pas `username`).

---

Après ces corrections, redémarrez le backend et testez la connexion.
