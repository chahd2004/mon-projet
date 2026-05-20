package com.pfe.facturation.dto.response;




import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignatureResponseDTO {
    private boolean success;
    private String message;
    private Long factureId;
    private String numeroFacture;
    private String dateSignature;
    private String xmlSigne;
}