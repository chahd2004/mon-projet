package com.pfe.facturation.security;

import com.pfe.facturation.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service qui implémente UserDetailsService de Spring Security.
 *
 * Rôle :
 * - Charger un utilisateur depuis la base de données par son email
 * - Faire le pont entre Spring Security et notre entité User
 * - Retourner l'utilisateur sous forme de UserDetails
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Constructeur avec injection du repository
     * @param userRepository Repository pour accéder aux utilisateurs
     */
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Charge un utilisateur par son email
     * @param email L'email de l'utilisateur
     * @return L'utilisateur sous forme de UserDetails
     * @throws UsernameNotFoundException Si l'utilisateur n'est pas trouvé
     */
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Chercher l'utilisateur dans la base de données par email
        // 2. L'entité User implémente UserDetails, donc on peut la retourner directement
        // 3. Si l'utilisateur n'existe pas, on lance une exception
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur non trouvé avec l'email: " + email
                ));
        // Note : @Transactional permet de charger les relations LAZY (client, emetteur)
    }
}