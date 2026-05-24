# 🅿️ Smart Parking System

A full-stack database-driven web application built for the **COMP344 Database Management Systems** course at **Beirut Arab University**.

## 👥 Team
| Name 
|---
| Mahmoud Soudah 
| Mohammad Rabah

## 📋 About
The Smart Parking System allows users to browse parking lots, reserve slots, make payments, and track violations — all through a modern web dashboard. Admins manage lots, slots, users, and view occupancy reports.

## 🛠️ Tech Stack
- **Database:** MySQL 8.0
- **Backend:** Node.js + Express.js
- **Frontend:** HTML / CSS / JavaScript
- **Tools:** XAMPP, phpMyAdmin, VS Code, Thunder Client

## 🗄️ Database
10 fully normalized tables (3NF):
`Users` • `Vehicles` • `ParkingLots` • `ParkingSlots` • `Reservations` • `Payments` • `Reviews` • `Notifications` • `Violations` • `Discounts`

## 🚀 How to Run

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/smart-parking-system.git
cd smart-parking-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup database
- Open **phpMyAdmin**
- Create database: `SmartParkingSystem`
- Import: `smart_parking_schema.sql`

### 4. Configure environment
Create a `.env` file:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=SmartParkingSystem
DB_PORT=3306
PORT=3000
### 5. Start the server
```bash
node server.js
```

### 6. Open in browser
http://localhost:3000
## ✨ Features
- 🔐 Secure login and registration
- 🚗 Multi-vehicle management
- 🅿️ Real-time slot availability
- 📅 Online slot reservation
- 💳 Automatic payment calculation
- 🏷️ 10% discount for 3+ vehicle owners
- ⚠️ Overstay violation detection
- 👤 User dashboard
- 🔧 Admin control panel

## 📁 Project Structure
mart-parking-system/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── routes/
│   ├── users.js
│   ├── vehicles.js
│   ├── parkingLots.js
│   ├── parkingSlots.js
│   ├── reservations.js
│   ├── payments.js
|   ├──violations.js
│   └── routes_admin.js
├── db.js
├── server.js
├── .env
└── smart_parking_schema.sql
