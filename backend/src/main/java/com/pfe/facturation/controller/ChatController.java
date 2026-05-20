package com.pfe.facturation.controller;

import com.pfe.facturation.entity.User;
import com.pfe.facturation.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<String> chat(@RequestBody Map<String, String> body) {
        String message = body.get("message");

        // Récupérer l'utilisateur connecté depuis le contexte de sécurité
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();

        // Extraire l'entrepriseId (Emetteur)
        Long entrepriseId = null;
        if (user.getEntreprise() != null) {
            entrepriseId = user.getEntreprise().getId();
        }

        String response = chatService.getGroqResponse(message, entrepriseId);
        return ResponseEntity.ok(response);
    }
}