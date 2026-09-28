drop database if exists sistema_bancario;
create database sistema_bancario;
use sistema_bancario;

CREATE TABLE Cliente (
    id_cliente      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(80)  NOT NULL,
    apellido        VARCHAR(80)  NOT NULL,
    dpi_ficticio    VARCHAR(20)  NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    correo          VARCHAR(120) NOT NULL UNIQUE,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Usuario (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente      INT NULL,
    correo          VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol             ENUM('administrador','cajero') NOT NULL DEFAULT 'cajero',
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_usuario_cliente
        FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
        ON DELETE SET NULL
);

CREATE TABLE TipoCuenta (
    id_tipo_cuenta  INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE,
    tasa_interes    DECIMAL(5,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE Cuenta (
    id_cuenta       INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente      INT NOT NULL,
    id_tipo_cuenta  INT NOT NULL,
    numero_cuenta   VARCHAR(20) NOT NULL UNIQUE,
    saldo           DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
    fecha_apertura  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuenta_cliente
        FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
        ON DELETE RESTRICT,
    CONSTRAINT fk_cuenta_tipo
        FOREIGN KEY (id_tipo_cuenta) REFERENCES TipoCuenta(id_tipo_cuenta)
        ON DELETE RESTRICT,
    CONSTRAINT chk_saldo_no_negativo CHECK (saldo >= 0)
);

CREATE TABLE Movimiento (
    id_movimiento     INT AUTO_INCREMENT PRIMARY KEY,
    id_cuenta         INT NOT NULL,
    tipo              ENUM('deposito','retiro','transferencia_entrada','transferencia_salida') NOT NULL,
    monto             DECIMAL(14,2) NOT NULL,
    saldo_resultante  DECIMAL(14,2) NOT NULL,
    fecha             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_cuenta
        FOREIGN KEY (id_cuenta) REFERENCES Cuenta(id_cuenta)
        ON DELETE RESTRICT,
    CONSTRAINT chk_monto_positivo CHECK (monto > 0)
);

CREATE TABLE Transferencia (
    id_transferencia  INT AUTO_INCREMENT PRIMARY KEY,
    id_cuenta_origen  INT NOT NULL,
    id_cuenta_destino INT NOT NULL,
    monto             DECIMAL(14,2) NOT NULL,
    fecha             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transferencia_origen
        FOREIGN KEY (id_cuenta_origen) REFERENCES Cuenta(id_cuenta),
    CONSTRAINT fk_transferencia_destino
        FOREIGN KEY (id_cuenta_destino) REFERENCES Cuenta(id_cuenta),
    CONSTRAINT chk_transferencia_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_cuentas_distintas CHECK (id_cuenta_origen <> id_cuenta_destino)
);

INSERT INTO TipoCuenta (nombre, tasa_interes) VALUES
    ('Ahorro', 2.50),
    ('Monetaria', 0.50);

INSERT INTO Cliente (nombre, apellido, dpi_ficticio, telefono, correo) VALUES
    ('Ana', 'Pérez',   '1000000010101', '5555-1010', 'ana.perez@correoficticio.com'),
    ('Luis', 'Gómez',  '1000000010102', '5555-1011', 'luis.gomez@correoficticio.com'),
    ('María', 'López', '1000000010103', '5555-1012', 'maria.lopez@correoficticio.com');

INSERT INTO Usuario (id_cliente, correo, password_hash, rol) VALUES
    (NULL, 'admin@bancoacademico.com',  '$2b$10$examplehashadmin000000000000000000000000000', 'administrador'),
    (1,    'cajero@bancoacademico.com', '$2b$10$examplehashcajero00000000000000000000000000', 'cajero');

INSERT INTO Cuenta (id_cliente, id_tipo_cuenta, numero_cuenta, saldo) VALUES
    (1, 1, '4000-0001', 1500.00),
    (2, 2, '4000-0002', 800.00),
    (3, 1, '4000-0003', 0.00);

INSERT INTO Movimiento (id_cuenta, tipo, monto, saldo_resultante) VALUES
    (1, 'deposito', 1500.00, 1500.00),
    (2, 'deposito', 800.00, 800.00);
