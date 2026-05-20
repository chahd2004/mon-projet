package com.pfe.facturation.dto.request;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SignatureRequestDTO {
    private MultipartFile p12File;
    private String password;
    private Long factureId;
}