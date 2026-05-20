package com.pfe.facturation.service;





import com.pfe.facturation.dto.request.SignatureRequestDTO;
import com.pfe.facturation.dto.response.SignatureResponseDTO;

public interface SignatureElectroniqueService {
    SignatureResponseDTO signerFacture(SignatureRequestDTO request) throws Exception;
}