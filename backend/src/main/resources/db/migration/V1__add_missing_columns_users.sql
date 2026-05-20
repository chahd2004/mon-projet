-- =====================================================
-- Migration : Ajout des colonnes manquantes dans la table users
-- Erreur corrigée : column u1_0.failed_attempts does not exist
-- =====================================================

-- Ajout de la colonne failed_attempts (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;

-- Ajout de la colonne locked_until (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Ajout de la colonne first_login (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT TRUE;

-- Ajout de la colonne last_login_date (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_date TIMESTAMP;

-- Ajout de la colonne password_changed_date (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_changed_date TIMESTAMP;

-- Ajout de la colonne password_expiry_date (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_expiry_date TIMESTAMP;

-- Ajout de la colonne subscription_start_date (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;

-- Ajout de la colonne subscription_end_date (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Ajout de la colonne account_status (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Ajout de la colonne updated_at (si elle n'existe pas)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

