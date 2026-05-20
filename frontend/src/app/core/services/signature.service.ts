// src/app/services/signature.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignatureService {

  private apiUrl = `${environment.apiUrl}/signature`;

  constructor(private http: HttpClient) {}

  /**
   * Signer une facture (backend)
   * Envoie le fichier .p12 et le mot de passe au serveur qui signe avec DSS
   */
  async signerFactureBackend(p12File: File, password: string, factureId: number): Promise<any> {
    const formData = new FormData();
    formData.append('p12File', p12File);
    formData.append('password', password);
    formData.append('factureId', factureId.toString());

    return firstValueFrom(
      this.http.post(`${this.apiUrl}/signer`, formData)
    );
  }

  /**
   * Signer un bon de commande (backend)
   */
  async signerBonCommandeBackend(p12File: File, password: string, bonCommandeId: number): Promise<any> {
    const formData = new FormData();
    formData.append('p12File', p12File);
    formData.append('password', password);
    formData.append('bonCommandeId', bonCommandeId.toString());

    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/bon-commandes/signer-client`, formData)
    );
  }

  /**
   * Signer un bon de livraison (backend)
   */
  async signerBonLivraisonBackend(p12File: File, password: string, bonLivraisonId: number): Promise<any> {
    const formData = new FormData();
    formData.append('p12File', p12File);
    formData.append('password', password);
    formData.append('bonLivraisonId', bonLivraisonId.toString());

    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/bon-livraisons/signer-client`, formData)
    );
  }

  /**
   * Télécharger le XML signé d'une facture
   */
  async telechargerXmlSigne(factureId: number): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${this.apiUrl}/xml/${factureId}`, { responseType: 'blob' })
    );
  }

  /**
   * Vérifier le statut de signature d'une facture
   */
  async getStatutSignature(factureId: number): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.apiUrl}/statut/${factureId}`)
    );
  }

  // =====================================================
  // SIGNATURE CLIENT-SIDE (XAdES) - Public Versions
  // =====================================================

  async getXmlBrutBCPublic(bonCommandeId: number): Promise<string> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/public/bon-commande/${bonCommandeId}/xml-brut`, 
        { responseType: 'text' })
    );
  }

  async getXmlBrutBLPublic(bonLivraisonId: number): Promise<string> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/public/bon-livraison/${bonLivraisonId}/xml-brut`, 
        { responseType: 'text' })
    );
  }

  async envoyerXmlSigneBCPublic(bonCommandeId: number, xmlSigne: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/public/bon-commande/${bonCommandeId}/xml-signe`, 
        { xmlSigne })
    );
  }

  async envoyerXmlSigneBLPublic(bonLivraisonId: number, xmlSigne: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/public/bon-livraison/${bonLivraisonId}/xml-signe`, 
        { xmlSigne })
    );
  }

  // =====================================================
  // SIGNATURE CLIENT-SIDE (XAdES)
  // =====================================================

  /**
   * Récupérer le XML brut d'un bon de commande
   */
  async getXmlBrutBC(bonCommandeId: number): Promise<string> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/bon-commandes/${bonCommandeId}/xml-brut`, 
        { responseType: 'text' })
    );
  }

  /**
   * Récupérer le XML brut d'un bon de livraison
   */
  async getXmlBrutBL(bonLivraisonId: number): Promise<string> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/bon-livraisons/${bonLivraisonId}/xml-brut`, 
        { responseType: 'text' })
    );
  }

  /**
   * Signer un XML localement avec XAdES (client-side)
   * Utilise la bibliothèque xadesjs et node-forge
   */
  async signerXAdES(
    p12File: File,
    password: string,
    xmlBrut: string,
    documentId: number
  ): Promise<string> {
    try {
      // Import dynamique pour éviter les problèmes de bundle
      const forge = await import('node-forge');
      const xadesjs = await import('xadesjs');

      // 1. Lire le fichier P12
      const p12Data = await this.lireP12(p12File, password, forge);
      
      if (!p12Data) {
        throw new Error('Impossible de charger le certificat P12');
      }

      // 2. Signer le XML avec XAdES
      const xmlSigne = await this.signerXMLAvecXAdES(
        xmlBrut,
        p12Data.cert,
        p12Data.key,
        documentId
      );

      return xmlSigne;

    } catch (err: any) {
      console.error('Erreur signature XAdES:', err);
      throw new Error(`Erreur de signature : ${err.message}`);
    }
  }

  /**
   * Envoyer le XML signé d'un bon de commande au backend
   */
  async envoyerXmlSigneBC(bonCommandeId: number, xmlSigne: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/bon-commandes/${bonCommandeId}/xml-signe`, 
        { xmlSigne })
    );
  }

  /**
   * Envoyer le XML signé d'un bon de livraison au backend
   */
  async envoyerXmlSigneBL(bonLivraisonId: number, xmlSigne: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/bon-livraisons/${bonLivraisonId}/xml-signe`, 
        { xmlSigne })
    );
  }

  // =====================================================
  // MÉTHODES PRIVÉES
  // =====================================================

  /**
   * Lire et parser un fichier P12/PFX
   */
  private async lireP12(p12File: File, password: string, forge: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const binaryString = reader.result as string;
          const p12Asn1 = forge.asn1.fromDer(binaryString);
          const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
          
          const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
          const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
          
          const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
          const certBag = certBags[forge.pki.oids.certBag]?.[0];
          
          if (!keyBag || !certBag) {
            return reject(new Error('Certificat ou clé manquante dans le fichier P12'));
          }

          resolve({
            key: keyBag.key,
            cert: certBag.cert
          });
        } catch (err) {
          reject(new Error(`Erreur lecture P12: ${err}`));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsBinaryString(p12File);
    });
  }

  /**
   * Signer un XML avec XAdES (client-side)
   */
  private async signerXMLAvecXAdES(
    xmlString: string,
    cert: any,
    key: any,
    documentId: number
  ): Promise<string> {
    try {
      // Implémentation basique avec xadesjs
      // Note: L'implémentation exacte dépend de votre version de xadesjs
      // Ceci est un exemple simplifié
      
      // Pour une implémentation complète, utiliser:
      // const signature = new xadesjs.XAdESSignature();
      // signature.addReference(...);
      // signature.sign(key, cert);
      
      // Pour maintenant, retourner le XML tel quel (sera amélioré)
      return xmlString;
      
    } catch (err: any) {
      console.error('Erreur signature XML:', err);
      throw new Error(`Erreur signature XAdES: ${err.message}`);
    }
  }
}