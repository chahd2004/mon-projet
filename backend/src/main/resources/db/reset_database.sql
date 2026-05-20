-- =====================================================
-- RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES
-- Application : facturation_db
-- =====================================================

-- Supprimer toutes les tables dans le bon ordre (respect des FK)
DROP TABLE IF EXISTS ligne_facture CASCADE;
DROP TABLE IF EXISTS factures CASCADE;
DROP TABLE IF EXISTS produits CASCADE;
DROP TABLE IF EXISTS demandes_emetteur CASCADE;
DROP TABLE IF EXISTS emetteurs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les séquences générées par Hibernate si elles existent
DROP SEQUENCE IF EXISTS users_seq CASCADE;
DROP SEQUENCE IF EXISTS clients_seq CASCADE;
DROP SEQUENCE IF EXISTS emetteurs_seq CASCADE;
DROP SEQUENCE IF EXISTS factures_seq CASCADE;
DROP SEQUENCE IF EXISTS ligne_facture_seq CASCADE;
DROP SEQUENCE IF EXISTS produits_seq CASCADE;
DROP SEQUENCE IF EXISTS demandes_emetteur_seq CASCADE;

-- =====================================================
-- RECRÉATION DES TABLES
-- =====================================================

-- Table users
CREATE TABLE users (
    id                     BIGSERIAL PRIMARY KEY,
    email                  VARCHAR(100) NOT NULL UNIQUE,
    password               VARCHAR(255) NOT NULL,
    nom                    VARCHAR(50),
    prenom                 VARCHAR(50),
    telephone              VARCHAR(20),
    role                   VARCHAR(30)  NOT NULL,
    account_status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    first_login            BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_date        TIMESTAMP,
    password_changed_date  TIMESTAMP,
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP,
    failed_attempts        INTEGER      NOT NULL DEFAULT 0,
    locked_until           TIMESTAMP,
    subscription_start_date TIMESTAMP,
    subscription_end_date  TIMESTAMP,
    password_expiry_date   TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

-- Table clients
CREATE TABLE clients (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(255) NOT NULL UNIQUE,
    raison_sociale   VARCHAR(255),
    matricule_fiscal VARCHAR(255) UNIQUE,
    forme_juridique  VARCHAR(50),
    adresse_complete VARCHAR(255),
    pays             VARCHAR(100),
    region           VARCHAR(50),
    email            VARCHAR(100),
    telephone        VARCHAR(20),
    site_web         VARCHAR(255),
    iban             VARCHAR(34),
    banque           VARCHAR(255),
    user_id          BIGINT UNIQUE REFERENCES users(id)
);

-- Table emetteurs
CREATE TABLE emetteurs (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(255) NOT NULL UNIQUE,
    raison_sociale   VARCHAR(150) NOT NULL,
    matricule_fiscal VARCHAR(255) NOT NULL UNIQUE,
    forme_juridique  VARCHAR(50),
    adresse_complete VARCHAR(255),
    pays             VARCHAR(100) DEFAULT 'TUNISIE',
    region           VARCHAR(50),
    email            VARCHAR(100),
    telephone        VARCHAR(20),
    site_web         VARCHAR(255),
    iban             VARCHAR(34),
    banque           VARCHAR(255),
    user_id          BIGINT UNIQUE REFERENCES users(id)
);

-- Table produits
CREATE TABLE produits (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(255),
    designation  VARCHAR(255),
    description  TEXT,
    prix_ht      NUMERIC(15,2),
    taux_tva     NUMERIC(5,2),
    unite        VARCHAR(50),
    emetteur_id  BIGINT REFERENCES emetteurs(id)
);

-- Table factures
CREATE TABLE factures (
    id                    BIGSERIAL PRIMARY KEY,
    num_fact              VARCHAR(255) NOT NULL UNIQUE,
    date_emission         DATE         NOT NULL,
    date_paiement         DATE         NOT NULL,
    acheteur_client_id    BIGINT REFERENCES clients(id),
    acheteur_emetteur_id  BIGINT REFERENCES emetteurs(id),
    vendeur_id            BIGINT       NOT NULL REFERENCES emetteurs(id),
    nom_acheteur          VARCHAR(255),
    adresse_acheteur      VARCHAR(255),
    email_acheteur        VARCHAR(100),
    telephone_acheteur    VARCHAR(20),
    nom_vendeur           VARCHAR(255),
    adresse_vendeur       VARCHAR(255),
    email_vendeur         VARCHAR(100),
    telephone_vendeur     VARCHAR(20),
    statut                VARCHAR(30),
    mode_paiement         VARCHAR(30),
    total_ht              NUMERIC(15,2),
    montant_tva           NUMERIC(15,2),
    total_ttc             NUMERIC(15,2),
    notes                 TEXT
);

-- Table ligne_facture
CREATE TABLE ligne_facture (
    id           BIGSERIAL PRIMARY KEY,
    facture_id   BIGINT REFERENCES factures(id),
    produit_id   BIGINT REFERENCES produits(id),
    designation  VARCHAR(255),
    quantite     NUMERIC(15,2),
    prix_ht      NUMERIC(15,2),
    taux_tva     NUMERIC(5,2),
    montant_ht   NUMERIC(15,2),
    montant_tva  NUMERIC(15,2),
    montant_ttc  NUMERIC(15,2)
);

-- Table demandes_emetteur
CREATE TABLE demandes_emetteur (
    id                       BIGSERIAL PRIMARY KEY,
    code                     VARCHAR(255) NOT NULL,
    raison_sociale           VARCHAR(255) NOT NULL,
    matricule_fiscal         VARCHAR(255) NOT NULL UNIQUE,
    forme_juridique          VARCHAR(50),
    adresse_complete         VARCHAR(255) NOT NULL,
    region                   VARCHAR(50),
    email                    VARCHAR(100) NOT NULL,
    telephone                VARCHAR(20),
    site_web                 VARCHAR(255),
    iban                     VARCHAR(34),
    banque                   VARCHAR(255),
    nom_responsable          VARCHAR(100),
    prenom_responsable       VARCHAR(100),
    fonction_responsable     VARCHAR(100),
    status                   VARCHAR(20)  DEFAULT 'REQUESTED',
    date_soumission          TIMESTAMP,
    date_traitement          TIMESTAMP,
    commentaire_traitement   VARCHAR(500),
    ip_adresse               VARCHAR(50),
    user_agent               VARCHAR(500),
    user_cree_id             BIGINT UNIQUE REFERENCES users(id),
    emetteur_cree_id         BIGINT UNIQUE REFERENCES emetteurs(id)
);

-- =====================================================
-- INSERTION DU SUPER ADMIN PAR DÉFAUT
-- Email    : admin@facturation.com
-- Password : Admin@1234  (BCrypt)
-- =====================================================
INSERT INTO users (email, password, nom, prenom, role, account_status, first_login, created_at, updated_at, failed_attempts)
VALUES (
    'admin@facturation.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8RDvmYg5Q4VVnvkf2i',
    'Super',
    'Admin',
    'SUPER_ADMIN',
    'ACTIVE',
    FALSE,
    NOW(),
    NOW(),
    0
);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
SELECT 'Base de données réinitialisée avec succès !' AS message;
SELECT 'Super Admin créé : admin@facturation.com / Admin@1234' AS credentials;

