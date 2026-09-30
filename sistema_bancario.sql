drop database if exists sistema_bancario;
create database sistema_bancario;
use sistema_bancario;

create table Cliente (
    id_cliente      int auto_increment primary key,
    nombre          varchar(80)  not null,
    apellido        varchar(80)  not null,
    dpi_ficticio    varchar(20)  not null unique,
    telefono        varchar(20),
    correo          varchar(120) not null unique,
    activo          boolean      not null default true,
    fecha_registro  datetime     not null default current_timestamp
);

create table Usuario (
    id_usuario      int auto_increment primary key,
    id_cliente      int null,
    correo          varchar(120) not null unique,
    password_hash   varchar(255) not null,
    rol             enum('administrador','cajero') not null default 'cajero',
    activo          boolean not null default true,
    constraint fk_usuario_cliente
        foreign key (id_cliente) references Cliente(id_cliente)
        on delete set null
);

create table TipoCuenta (
    id_tipo_cuenta  int auto_increment primary key,
    nombre          varchar(50) not null unique,
    tasa_interes    decimal(5,2) not null default 0.00
);

create table Cuenta (
    id_cuenta       int auto_increment primary key,
    id_cliente      int not null,
    id_tipo_cuenta  int not null,
    numero_cuenta   varchar(20) not null unique,
    saldo           decimal(14,2) not null default 0.00,
    estado          enum('activa','inactiva') not null default 'activa',
    fecha_apertura  datetime not null default current_timestamp,
    constraint fk_cuenta_cliente
        foreign key (id_cliente) references Cliente(id_cliente)
        on delete restrict,
    constraint fk_cuenta_tipo
        foreign key (id_tipo_cuenta) references TipoCuenta(id_tipo_cuenta)
        on delete restrict,
    constraint chk_saldo_no_negativo check (saldo >= 0)
);

create table Movimiento (
    id_movimiento     int auto_increment primary key,
    id_cuenta         int not null,
    tipo              enum('deposito','retiro','transferencia_entrada','transferencia_salida') not null,
    monto             decimal(14,2) not null,
    saldo_resultante  decimal(14,2) not null,
    fecha             datetime not null default current_timestamp,
    constraint fk_movimiento_cuenta
        foreign key (id_cuenta) references Cuenta(id_cuenta)
        on delete restrict,
    constraint chk_monto_positivo check (monto > 0)
);

create table Transferencia (
    id_transferencia  int auto_increment primary key,
    id_cuenta_origen  int not null,
    id_cuenta_destino int not null,
    monto             decimal(14,2) not null,
    fecha             datetime not null default current_timestamp,
    constraint fk_transferencia_origen
        foreign key (id_cuenta_origen) references Cuenta(id_cuenta),
    constraint fk_transferencia_destino
        foreign key (id_cuenta_destino) references Cuenta(id_cuenta),
    constraint chk_transferencia_monto_positivo check (monto > 0),
    constraint chk_cuentas_distintas check (id_cuenta_origen <> id_cuenta_destino)
);

insert into TipoCuenta (nombre, tasa_interes) values
    ('Ahorro Basico', 2.50),
    ('Ahorro Premium', 3.25),
    ('Monetaria', 0.50),
    ('Monetaria Empresarial', 0.75),
    ('Ahorro Juvenil', 2.00),
    ('Ahorro Programado', 3.75),
    ('Cuenta Nomina', 0.25),
    ('Cuenta Estudiantil', 1.50),
    ('Ahorro Plus', 4.00),
    ('Cuenta Digital', 1.00);

-- ---------- Cliente (10) ----------
insert into Cliente (nombre, apellido, dpi_ficticio, telefono, correo) values
    ('Ana',     'Perez',    '1000000010101', '5555-1010', 'ana.perez@correoficticio.com'),
    ('Luis',    'Gomez',    '1000000010102', '5555-1011', 'luis.gomez@correoficticio.com'),
    ('Maria',   'Lopez',    '1000000010103', '5555-1012', 'maria.lopez@correoficticio.com'),
    ('Carlos',  'Ramirez',  '1000000010104', '5555-1013', 'carlos.ramirez@correoficticio.com'),
    ('Sofia',   'Martinez', '1000000010105', '5555-1014', 'sofia.martinez@correoficticio.com'),
    ('Diego',   'Hernandez','1000000010106', '5555-1015', 'diego.hernandez@correoficticio.com'),
    ('Valeria', 'Castillo', '1000000010107', '5555-1016', 'valeria.castillo@correoficticio.com'),
    ('Andres',  'Morales',  '1000000010108', '5555-1017', 'andres.morales@correoficticio.com'),
    ('Camila',  'Ortiz',    '1000000010109', '5555-1018', 'camila.ortiz@correoficticio.com'),
    ('Jose',    'Fuentes',  '1000000010110', '5555-1019', 'jose.fuentes@correoficticio.com');

-- ---------- Usuario (10) ----------
-- Contraseñas ficticias
--   admin@bancoacademico.com     -> Admin123*
--   cajero@bancoacademico.com    -> Cajero123*
--   usuario03@bancoacademico.com -> Usuario03*
insert into Usuario (id_cliente, correo, password_hash, rol) values
    (null, 'admin@bancoacademico.com',      '$2b$10$qlVgAbgycSOuO4vA2OFvy.dRsbLa/.u/FMsIiJX.E3Jkx9IUGPyqa', 'administrador'),
    (null, 'cajero@bancoacademico.com',     '$2b$10$QwLZcbZ2h65FynI4UflSaeYE7Vm.qlLKKZIs2XGJP5YzBc4y/Dj02', 'cajero'),
    (1,    'usuario03@bancoacademico.com',  '$2b$10$2phm0VkP0OMh8ufUu/juyOck3M8QKv9QaFVAXmKikvi1vQLw9kn0.', 'cajero'),
    (2,    'usuario04@bancoacademico.com',  '$2b$10$IL9Y4adyC6cS9MVsZI8gjuiDgg3YYEUFpeNB9VL6eFWBLh6Ukvkcm', 'cajero'),
    (null, 'usuario05@bancoacademico.com',  '$2b$10$6oe6H7RAO7yrj3lcQeUJAOxSo8/tq6EbAe4SZnuwPCzLtgFU7jGrq', 'cajero'),
    (null, 'usuario06@bancoacademico.com',  '$2b$10$QFg1vgQ1N4UGJFMtzl4otuY.sT/5lpJiIM2oOlQi0mWGK2oaO4MCG', 'cajero'),
    (null, 'usuario07@bancoacademico.com',  '$2b$10$EkcK.Y/VwbDrZ1SNiDUWj.TNu8KwgTrQSxVkMJSq56D2gZW2q836C', 'cajero'),
    (null, 'usuario08@bancoacademico.com',  '$2b$10$vlXDZGEYrMdeWdeuTa9Zf.gw/RB7rYloNIpEObs9DPyyAmG41s6j6', 'cajero'),
    (null, 'usuario09@bancoacademico.com',  '$2b$10$qGDf7JS7X/9g6ZIiHA9Jlu7u0vIPCDNLRHOgEZajIKYy.BNjPhm8K', 'cajero'),
    (null, 'usuario10@bancoacademico.com',  '$2b$10$ZBVVi5h4HkR1akPt5m5x9eTAm9GnQb4UBksFqub5ewdOUWdDG2VeC', 'cajero');

insert into Cuenta (id_cliente, id_tipo_cuenta, numero_cuenta, saldo, estado) values
    (1,  1,  '4000-0001', 1500.00, 'activa'),
    (2,  3,  '4000-0002', 800.00,  'activa'),
    (3,  1,  '4000-0003', 0.00,    'activa'),
    (4,  2,  '4000-0004', 3200.50, 'activa'),
    (5,  5,  '4000-0005', 150.00,  'activa'),
    (6,  3,  '4000-0006', 950.75,  'activa'),
    (7,  7,  '4000-0007', 4200.00, 'activa'),
    (8,  8,  '4000-0008', 60.00,   'inactiva'),
    (9,  9,  '4000-0009', 10500.00,'activa'),
    (10, 10, '4000-0010', 25.30,   'inactiva');

insert into Movimiento (id_cuenta, tipo, monto, saldo_resultante) values
    (1, 'deposito', 1500.00, 1500.00),
    (2, 'deposito', 800.00,  800.00),
    (4, 'deposito', 3500.00, 3500.00),
    (4, 'retiro',   299.50,  3200.50),
    (5, 'deposito', 150.00,  150.00),
    (6, 'deposito', 1000.00, 1000.00),
    (6, 'retiro',   49.25,   950.75),
    (7, 'deposito', 4200.00, 4200.00),
    (9, 'deposito', 10500.00,10500.00),
    (8, 'deposito', 60.00,   60.00);

insert into Transferencia (id_cuenta_origen, id_cuenta_destino, monto) values
    (1, 2, 50.00),
    (4, 3, 100.00),
    (6, 5, 25.00),
    (7, 9, 300.00),
    (9, 1, 200.00),
    (2, 6, 75.50),
    (5, 3, 10.00),
    (4, 7, 150.00),
    (1, 5, 20.00),
    (7, 6, 60.00);

delimiter $$

create procedure sp_registrar_deposito (
    in p_id_cuenta int,
    in p_monto decimal(14,2)
)
begin
    declare v_estado varchar(20);
    declare v_saldo decimal(14,2);

    if p_monto <= 0 then
        signal sqlstate '45000' set message_text = 'El monto del deposito debe ser mayor que cero.';
    end if;

    select estado, saldo into v_estado, v_saldo
        from Cuenta where id_cuenta = p_id_cuenta
        for update;

    if v_estado is null then
        signal sqlstate '45000' set message_text = 'La cuenta indicada no existe.';
    end if;

    if v_estado <> 'activa' then
        signal sqlstate '45000' set message_text = 'La cuenta esta inactiva y no puede recibir depositos.';
    end if;

    update Cuenta set saldo = saldo + p_monto where id_cuenta = p_id_cuenta;

    insert into Movimiento (id_cuenta, tipo, monto, saldo_resultante)
        values (p_id_cuenta, 'deposito', p_monto, v_saldo + p_monto);
end$$

create procedure sp_registrar_retiro (
    in p_id_cuenta int,
    in p_monto decimal(14,2)
)
begin
    declare v_estado varchar(20);
    declare v_saldo decimal(14,2);

    if p_monto <= 0 then
        signal sqlstate '45000' set message_text = 'El monto del retiro debe ser mayor que cero.';
    end if;

    select estado, saldo into v_estado, v_saldo
        from Cuenta where id_cuenta = p_id_cuenta
        for update;

    if v_estado is null then
        signal sqlstate '45000' set message_text = 'La cuenta indicada no existe.';
    end if;

    if v_estado <> 'activa' then
        signal sqlstate '45000' set message_text = 'La cuenta esta inactiva y no puede realizar retiros.';
    end if;

    if p_monto > v_saldo then
        signal sqlstate '45000' set message_text = 'Saldo insuficiente para realizar el retiro.';
    end if;

    update Cuenta set saldo = saldo - p_monto where id_cuenta = p_id_cuenta;

    insert into Movimiento (id_cuenta, tipo, monto, saldo_resultante)
        values (p_id_cuenta, 'retiro', p_monto, v_saldo - p_monto);
end$$

create procedure sp_registrar_transferencia (
    in p_id_cuenta_origen int,
    in p_id_cuenta_destino int,
    in p_monto decimal(14,2)
)
begin
    declare v_estado_origen varchar(20);
    declare v_estado_destino varchar(20);
    declare v_saldo_origen decimal(14,2);
    declare v_saldo_destino decimal(14,2);

    if p_id_cuenta_origen = p_id_cuenta_destino then
        signal sqlstate '45000' set message_text = 'No se puede transferir hacia la misma cuenta.';
    end if;

    if p_monto <= 0 then
        signal sqlstate '45000' set message_text = 'El monto de la transferencia debe ser mayor que cero.';
    end if;

    select estado, saldo into v_estado_origen, v_saldo_origen
        from Cuenta where id_cuenta = p_id_cuenta_origen
        for update;

    select estado, saldo into v_estado_destino, v_saldo_destino
        from Cuenta where id_cuenta = p_id_cuenta_destino
        for update;

    if v_estado_origen is null or v_estado_destino is null then
        signal sqlstate '45000' set message_text = 'Alguna de las cuentas indicadas no existe.';
    end if;

    if v_estado_origen <> 'activa' or v_estado_destino <> 'activa' then
        signal sqlstate '45000' set message_text = 'Ambas cuentas deben estar activas para transferir.';
    end if;

    if p_monto > v_saldo_origen then
        signal sqlstate '45000' set message_text = 'Saldo insuficiente en la cuenta origen.';
    end if;

    update Cuenta set saldo = saldo - p_monto where id_cuenta = p_id_cuenta_origen;
    update Cuenta set saldo = saldo + p_monto where id_cuenta = p_id_cuenta_destino;

    insert into Transferencia (id_cuenta_origen, id_cuenta_destino, monto)
        values (p_id_cuenta_origen, p_id_cuenta_destino, p_monto);

    insert into Movimiento (id_cuenta, tipo, monto, saldo_resultante)
        values (p_id_cuenta_origen, 'transferencia_salida', p_monto, v_saldo_origen - p_monto);

    insert into Movimiento (id_cuenta, tipo, monto, saldo_resultante)
        values (p_id_cuenta_destino, 'transferencia_entrada', p_monto, v_saldo_destino + p_monto);
end$$

create procedure sp_consultar_movimientos (
    in p_id_cuenta int
)
begin
    select id_movimiento, tipo, monto, saldo_resultante, fecha
        from Movimiento
        where id_cuenta = p_id_cuenta
        order by fecha desc;
end$$

create procedure sp_reporte_resumen_operaciones ()
begin
    select tipo,
           count(*) as cantidad_operaciones,
           sum(monto) as monto_total
        from Movimiento
        group by tipo;
end$$

delimiter ;