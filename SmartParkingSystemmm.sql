CREATE DATABASE IF NOT EXISTS SmartParkingSystem
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE SmartParkingSystem;

-- 1. Users
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Vehicles
CREATE TABLE Vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type ENUM('car','motorcycle','truck') NOT NULL,
    brand VARCHAR(50),
    color VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. ParkingLots
CREATE TABLE ParkingLots (
    lot_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    lot_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);

-- 4. ParkingSlots
CREATE TABLE ParkingSlots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id INT NOT NULL,
    slot_number VARCHAR(10) NOT NULL,
    floor_level INT DEFAULT 0,
    slot_type ENUM('standard','compact','handicap','ev_charging') DEFAULT 'standard',
    status ENUM('available','occupied','maintenance') DEFAULT 'available',
    FOREIGN KEY (lot_id) REFERENCES ParkingLots(lot_id)
);

-- 5. Reservations
CREATE TABLE Reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    actual_entry DATETIME,
    actual_exit DATETIME,
    status ENUM('pending','active','completed','cancelled') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (slot_id) REFERENCES ParkingSlots(slot_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id)
);

-- 6. Payments
CREATE TABLE Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    violation_id INT,
    amount DECIMAL(10,2),
    payment_method ENUM('cash','credit_card','debit_card','online'),
    payment_status ENUM('pending','paid','refunded','failed'),
    transaction_ref VARCHAR(100),
    paid_at DATETIME
);

-- 7. Reviews
CREATE TABLE Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    lot_id INT,
    rating INT,
    comment TEXT
);

-- 8. Notifications
CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    reservation_id INT,
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE
);

-- 9. Violations
CREATE TABLE Violations (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    user_id INT,
    overstay_minutes INT,
    fine_amount DECIMAL(10,2),
    violation_status VARCHAR(50),
    payment_id INT
);

-- 10. Discounts
CREATE TABLE Discounts (
    discount_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50),
    description VARCHAR(255),
    discount_percent INT,
    valid_from DATETIME,
    valid_until DATETIME,
    is_active BOOLEAN
);

-- 11. ReservationDiscounts
CREATE TABLE ReservationDiscounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    discount_id INT
);
INSERT INTO Users (full_name, email, password_hash, role)
VALUES ('ADMIN TEST', 'ADMIN@test.com', '123', 'admin');

INSERT INTO ParkingLots (admin_id, lot_name, address, city, hourly_rate, open_time, close_time)
VALUES (1, 'Downtown', '123 Main St', 'Beirut', 5.00, '06:00:00', '23:00:00');
INSERT INTO ParkingLots (admin_id, lot_name, address, city, hourly_rate, open_time, close_time)
VALUES (1, 'rawshe', '123 Main St', 'Beirut', 5.00, '06:00:00', '23:00:00');

select u.user_id,
     u.full_name,
       u.email,
       v.plate_number,
       v.vehicle_type
from users u
join vehicles v
on u.user_id=v.user_id;

select * from parkinglots;
INSERT INTO ParkingSlots (lot_id, slot_number, floor_level, slot_type)
VALUES (1, 'A100', 0, 'standard'),
       (2, 'A223', 0, 'standard'),
       (3,'A344',1,'standard');
       
select user_id from users;
INSERT INTO Vehicles (user_id, plate_number, vehicle_type, brand, color)
VALUES (2, 'ABC123', 'car', 'Toyota', 'Red');

