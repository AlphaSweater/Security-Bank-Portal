
![Logo](https://i.postimg.cc/L6MYhpN8/Logo-With-Title.png)


<h1 align="center">Security Bank Portal</h1>

<p align="center"> 
  <img src="https://img.shields.io/badge/Built%20with-Node.js-green?logo=node.js" alt="Node.js"> <img src="https://img.shields.io/badge/Security%20-%20Argon2%20%2B%20Joi-blue" alt="Argon2 and Joi">
</p>

<br>

## 📝 Overview
Security Bank Portal is a secure Node.js / Express prototype that lets users register, log in, and perform international transfers. The project focuses on real-world security practices: input validation with Joi and password hashing with Argon2. The README includes local HTTPS setup for a production-like environment during development.

Whether you’re searching for a cozy spot to study, a trendy café to meet friends, or the perfect latte, Cape Town Coffees connects you to the city’s best brews.

<br>

## 📚 Table of Contents
- [How to Install and Setup](#-how-to-install-and-setup)
- [How to Setup HTTPS Certificates](#-how-to-setup-https-certificates)
- [Features](#-features)
- [Security Features](#-security-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Security Implementation and File Explanation](#-security-implementation-and-file-explanations)
- [Video Demonstration](#-video-demo)
- [Contributors](#-contributors)
- [Learning Outcomes](#-learning-outcomes)
- [References](#-references)

<br>

## ⚙️ How to Install and Setup
### 1. Clone repo
```
git clone https://github.com/YourTeam/GlobalBankSecure.git
```
```
cd GlobalBankSecure
```

### 2. Install dependencies
```
npm install
```

### 3. Create .env
```
PORT=3000
```
```
NODE_ENV=development
```
```
MONGO_URI=mongodb://localhost:27017/globalbank
```
```
SESSION_SECRET=some_secret_here
```

### 4. Generate HTTPS certs (see mkcert instructions above). Place certs in certs/ directory.

<br>

### 5. Run server (dev)
```
npm run dev
# (your dev script should start the server with https using certs/localhost.crt and certs/localhost.key)
```

### 6. Run tests
```
npm test
```

<br>

## 🧾 How to Setup HTTPS Certificates
To run local development with trusted HTTPS certs (no browser warnings), use mkcert.

### 1. Install mkcert
```
winget install --id FiloSottile.mkcert -e
```

### 2. Create a project-local CA (recommended)
```
$env:CAROOT = "$PWD\.certs\ca"
```
```
mkdir .certs\ca -Force
```
```
mkcert -install
```

### 3. Generate cert and key
```
mkdir certs -Force
```
```
mkcert -key-file .\certs\localhost.key -cert-file .\certs\localhost.crt localhost 127.0.0.1 ::1
```
- certs/localhost.crt and certs/localhost.key will be created.
- .certs/ca/ will contain the CA files for your project.

<br>

### 4. Clean up (optional)
```
$env:CAROOT = "$PWD\.certs\ca"
```
```
mkcert -uninstall
```
```
Remove-Item -Recurse -Force .\.certs\ca
```

<br>

## 🌟 Features

- Secure Sign Up and Login flows

- International money transfers with validation of amounts, currencies, SWIFT/BIC and account numbers

- Joi schemas for strong input validation and sanitisation

- Argon2id hashing for secure password storage

- Route-level rate limiting for auth endpoints

- Unit & security tests with Vitest

- Local HTTPS via mkcert for production-like dev environment

<br>

## 🔐 Security Features
- Argon2 (Argon2id) for password hashing

- Joi for input validation (users & transactions)

- Validation middleware that masks passwords in logs and returns structured error responses

- Tests that simulate NoSQL injection and XSS attempts to ensure the validation layer blocks them

- Route-level rate limiting to reduce brute-force and abuse

<br>

## 🔧 Tech Stack
- Node.js, Express.js

- Joi for validation

- argon2 for password hashing

- MongoDB (or any compatible persistence)

- Vitest for tests

- mkcert for local HTTPS certs

<br>

## 🏗️ Architecture
```
project/
├─ src/
│  ├─ controllers/           # Controller logic (auth, transactions)
│  ├─ middlewares/           # validationMiddleware.js, rateLimitMiddleware.js
│  ├─ models/                # userModel.js, transactionModel.js
│  ├─ routes/                # authRoutes.js, transactionRoutes.js
│  ├─ services/              # authService.js (Argon2), transactionService.js
│  ├─ utils/                 # asyncHandler.js, logger.js, validation helpers
│  └─ utils/validation/      # userValidation.js, transactionValidation.js
├─ certs/                    # local HTTPS certs (mkcert)
├─ tests/                    # Vitest suites
├─ .env
└─ package.json
```

<br>


## 🎥 Video Demo

📺 **Watch the full walkthrough of Security Bank Portal on YouTube:**
👉 [Click here to view](https://youtu.be/dnFBR1-XPvo?si=4kqEIKo2v5o-dgIs)

<br>

## 👥 contributors

- Chad Fairlie ST10269509
- Dhiren Ruthenavelu ST10256859
- Kayla Ferreira ST10259527
- Nathan Teixeira ST10249266

<br>

## 🧠 Learning Outcomes

- Implemented secure authentication using Argon2

- Designed strict input validation with Joi for user & transaction data

- Added route rate limiting and HTTPS for realistic security posture

- Created automated tests verifying validation blocks NoSQL/XSS attacks

- Built a layered Node.js architecture separating validation, services, and controllers

<br>

## 📚 References

- [Joi documentation](https://medium.com/@artemkhrenov/the-complete-guide-to-joi-validation-in-production-node-js-applications-96acaddae056)

- [Argon2 node module](https://hackernoon.com/argon2-in-practice-how-to-implement-secure-password-hashing-in-your-application)

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

- [mkcert — Simple local CA](https://medium.com/@dasbabai2017/how-to-create-tls-certificates-with-mkcert-and-integrate-them-with-spring-boot-node-js-and-go-ea3848f72341)

- ChatGPT assisted with explanations & documentation refinement

- ChatGPT helped with unit test creation

- ChatGPT was used to help with the design and planning. As well as assisted with finding and fixing errors in the code.

<br>
