-- ============================================
-- DISCOURSE SAAS - Esquema Multi-Tenant
-- ============================================
-- Este archivo contiene las tablas necesarias para
-- convertir Discourse en un SaaS multi-tenant
-- ============================================

-- ============================================
-- TABLAS DE TENANTS Y PLANES
-- ============================================

-- Planes de suscripción disponibles
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'pro', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) DEFAULT 0.00,
  price_yearly DECIMAL(10, 2) DEFAULT 0.00,
  max_users INT DEFAULT NULL, -- NULL = ilimitado
  max_communities INT DEFAULT NULL,
  max_storage_gb INT DEFAULT NULL,
  custom_domain BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  features JSON, -- Array de características en JSON
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tenants (instancias de foros)
CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE, -- subdominio: slug.discourse.com
  custom_domain VARCHAR(255) NULL, -- dominio personalizado (ej: mi-foro.com)
  owner_id INT NOT NULL, -- ID del usuario que creó el tenant
  plan_id INT NOT NULL DEFAULT 1, -- ID del plan (default: free)
  status ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial',
  trial_ends_at TIMESTAMP NULL,
  subscription_id VARCHAR(255) NULL, -- ID de suscripción en sistema de pagos (Stripe, etc.)
  db_name VARCHAR(100) NOT NULL, -- Nombre de la base de datos del tenant
  db_host VARCHAR(255) NULL, -- Host de BD personalizado (NULL = usar BD principal)
  settings JSON, -- Configuraciones del tenant (logo, colores, etc.)
  metadata JSON, -- Información adicional
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  INDEX idx_slug (slug),
  INDEX idx_custom_domain (custom_domain),
  INDEX idx_owner (owner_id),
  INDEX idx_status (status),
  INDEX idx_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Suscripciones activas
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'canceled', 'past_due', 'unpaid') DEFAULT 'active',
  billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_provider VARCHAR(50) NULL, -- 'stripe', 'paypal', etc.
  payment_provider_id VARCHAR(255) NULL, -- ID en el proveedor de pagos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_status (status),
  INDEX idx_period_end (current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuarios administradores de tenants (pueden tener múltiples tenants)
CREATE TABLE IF NOT EXISTS tenant_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, -- ID del usuario en la tabla users principal
  tenant_id INT NOT NULL,
  role ENUM('owner', 'admin', 'moderator') DEFAULT 'admin',
  permissions JSON, -- Permisos específicos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tenant (user_id, tenant_id),
  INDEX idx_user (user_id),
  INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Estadísticas de uso por tenant (para límites de planes)
CREATE TABLE IF NOT EXISTS tenant_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  user_count INT DEFAULT 0,
  community_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) DEFAULT 0.00,
  api_requests INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tenant_period (tenant_id, period_start),
  INDEX idx_tenant (tenant_id),
  INDEX idx_period (period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DATOS INICIALES - PLANES
-- ============================================

-- Insertar planes por defecto
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_communities, max_storage_gb, custom_domain, api_access, priority_support, features) VALUES
('free', 'Free', 'Plan gratuito para empezar', 0.00, 0.00, 100, 10, 1, FALSE, FALSE, FALSE, 
  JSON_ARRAY('Hasta 100 usuarios', 'Hasta 10 comunidades', '1GB de almacenamiento', 'Soporte por email')),
('pro', 'Pro', 'Para comunidades en crecimiento', 29.99, 299.99, 1000, 100, 50, TRUE, TRUE, TRUE,
  JSON_ARRAY('Hasta 1000 usuarios', 'Hasta 100 comunidades', '50GB de almacenamiento', 'Dominio personalizado', 'API access', 'Soporte prioritario')),
('enterprise', 'Enterprise', 'Para organizaciones grandes', 199.99, 1999.99, NULL, NULL, 500, TRUE, TRUE, TRUE,
  JSON_ARRAY('Usuarios ilimitados', 'Comunidades ilimitadas', '500GB de almacenamiento', 'Dominio personalizado', 'API access', 'Soporte 24/7', 'SLA garantizado'))
ON DUPLICATE KEY UPDATE display_name=display_name;

-- ============================================
-- FUNCIONES Y PROCEDIMIENTOS ÚTILES
-- ============================================

-- Nota: El procedimiento almacenado CheckTenantLimits se omite aquí
-- porque DELIMITER no funciona en MySQL2 desde Node.js.
-- La funcionalidad está implementada en TypeScript en lib/tenant.ts
-- (función checkTenantLimit) que es más flexible y fácil de mantener.

