![Logo](https://i.postimg.cc/L6MYhpN8/Logo-With-Title.png)

<h1 align="center">Security Bank Portal</h1>

<p align="center"> 
  <img src="https://img.shields.io/badge/Built%20with-Node.js-green?logo=node.js" alt="Node.js"> <img src="https://img.shields.io/badge/Security%20-%20Argon2%20%2B%20Joi-blue" alt="Argon2 and Joi">
</p>

<br>

## 📝 Overview

Security Bank Portal is a secure Node.js / Express prototype that lets users register, log in, and perform international transfers. The project focuses on real-world security practices: input validation with Joi and password hashing with Argon2. The README includes local HTTPS setup for a production-like environment during development. This prototype demonstrates secure full-stack design principles inspired by OWASP and NIST guidelines. It includes automated vulnerability scanning via SonarQube and implements defense-in-depth practices suitable for real-world banking environments.

<br>

## 📚 Table of Contents

- [📝 Overview](#-overview)
- [📚 Table of Contents](#-table-of-contents)
- [🌟 Features](#-features)
- [🔐 Security Features](#-security-features)
- [🧱 Security Compliance and Hardening](-security-compliance-and-hardening)
- [⚙️ How to Install and Setup](#️-how-to-install-and-setup)
  - [1. Clone repo](#1-clone-repo)
  - [2. Generate HTTPS certs](#3-generate-https-certs)
  - [2.1. Install mkcert](#31-install-mkcert)
  - [2.2. Create a project-local CA](#32-create-a-project-local-ca)
  - [2.3. Generate cert and key](#33-generate-cert-and-key)
  - [2.4. Clean up (optional)](#34-clean-up-optional)
  - [3. Install dependencies (client \and server)](#2-install-dependencies-client--server)
  - [4. Run server (dev)](#4-run-server-dev)
  - [5. Run client (dev)](#5-run-client-dev)
- [🔧 Tech Stack](#-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [🧪 Testing Overview](#️-testing-overview)
- [📸 Screenshots](#-screenshots)
- [🎥 Video Demo](#-video-demo)
- [👥 contributors](#-contributors)
- [🧠 Learning Outcomes](#-learning-outcomes)
- [📚 References](#-references)

<br>

## 🌟 Features

- Secure Sign Up and Login flows

- International money transfers with validation of amounts, currencies, SWIFT/BIC and account numbers

- Joi schemas for strong input validation and sanitisation

- Argon2id hashing for secure password storage

- Route-level rate limiting for auth endpoints

- Unit and security tests with Vitest

- Local HTTPS via mkcert for production-like dev environment

<br>

## 🔐 Security Features

- Argon2 (Argon2id) for password hashing

- Joi for input validation (users and transactions)

- Validation middleware that masks passwords in logs and returns structured error responses

- Tests that simulate NoSQL injection and XSS attempts to ensure the validation layer blocks them

- Route-level rate limiting to reduce brute-force and abuse

<br>

## 🧱 Security Compliance and Hardening

The Security Bank Portal follows OWASP Top 10 and NIST recommendations for secure web development:

| Category | Implementation |
|-----------|----------------|
| **Input Validation** | All inputs validated and sanitized using Joi with RegEx whitelisting. |
| **Authentication** | Argon2id hashing with salt and secure session tokens. |
| **Authorization** | Role-based access (Customer vs. Employee). |
| **Transport Security** | Enforced HTTPS via mkcert certificates. |
| **Error Handling** | Centralized middleware masks internal errors and avoids leaking stack traces. |
| **Rate Limiting** | Express-rate-limit middleware for login and transaction endpoints. |
| **Dependency Security** | CircleCI pipeline runs SonarQube scans for vulnerabilities and code smells. |
| **Testing** | Vitest suite simulates NoSQL injection and XSS attacks. |

<br>

## ⚙️ How to Install and Setup

### 1. Clone repo

```
git clone https://github.com/YourTeam/GlobalBankSecure.git
```

```
cd GlobalBankSecure
```

### 2. Generate HTTPS certs

To run local development with trusted HTTPS certs (no browser warnings), use mkcert.

### 2.1. Install mkcert

```
winget install --id FiloSottile.mkcert -e
```

### 2.2. Create a project-local CA

From the root:

```
$env:CAROOT = "$PWD\.certs\ca"
```

```
mkdir .certs\ca -Force
```

```
mkcert -install
```

### 2.3. Generate cert and key

```
mkdir certs -Force
```

```
mkcert -key-file .\certs\localhost.key -cert-file .\certs\localhost.crt localhost 127.0.0.1 ::1
```

- certs/localhost.crt and certs/localhost.key will be created.
- .certs/ca/ will contain the CA files for your project.

<br>

### 2.4. Clean up (optional)

```
$env:CAROOT = "$PWD\.certs\ca"
```

```
mkcert -uninstall
```

```
Remove-Item -Recurse -Force .\.certs\ca
```

### 3. Install dependencies (client and server)

From the root:

```
cd client
npm install
```

```
cd ../server
npm install
```

<br>

### 4. Run server (dev)

From root:

```
cd server
npm run dev
```

### 5. Run client (dev)

From root:

```
cd client
npm run dev
```


## 🔧 Tech Stack

### 🧠 Core
- **[Node.js](https://nodejs.org/)** – JavaScript runtime environment for the backend.
- **[Express.js](https://expressjs.com/)** – Web framework for building APIs and middleware.
- **[Joi](https://joi.dev/)** – Schema-based validation for user and transaction data.
- **[argon2](https://www.npmjs.com/package/argon2)** – Secure password hashing algorithm.

### 🛢️ Database
- **[MongoDB](https://www.mongodb.com/)** – NoSQL database for storing user and transaction data.

### 🧪 Testing and Security
- **[Vitest](https://vitest.dev/)** – Unit and integration testing framework.
- **mkcert** – Tool for generating local HTTPS certificates.

### 🧰 DevSecOps and Code Quality
- **[CircleCI](https://circleci.com/)** – Continuous integration for running tests and security scans.
- **[SonarQube](https://www.sonarqube.org/)** – Automated vulnerability, hotspot, and code smell detection.
- **[Helmet](https://www.npmjs.com/package/helmet)** – Sets secure HTTP headers.
- **[express-rate-limit](https://www.npmjs.com/package/express-rate-limit)** – Protects against brute-force attacks.


<br>

## 🏗️ Architecture

```
project/
├─ client/                          # React frontend
│  ├─ src/
|  |  ├─ assets/                    # Assets for client
│  │  ├─ components/                # Reusable UI components
│  │  ├─ pages/                     # Auth, Dashboard, EmployeeTransactions, Landing, ManageEmployees, TestAuth, Transaction, Unauthorized pages
│  │  ├─ routing/                   # PrivateRoute.js, routes.js
│  │  ├─ utils/                     # Frontend helpers, validators
│  │  └─ App.jsx / main.js          # React entry files
│  └─ package.json
│
├─ server/                          # Backend API
│  ├─ src/
│  │  ├─ config/                    # Config files
│  │  ├─ controllers/               # Controller logic (auth, transaction, user)
│  │  ├─ middlewares/               # authMiddleware.js, errorHandlerMiddleware.js, rateLimitMiddleware.js, roleMiddleware.js, sessionMiddleware.js, validationMiddleware.js 
│  │  ├─ models/                    # userModel.js, transactionModel.js
│  │  ├─ routes/                    # authRoutes.js, transactionRoutes.js, userRoutes.js
│  │  ├─ services/                  # authService.js (Argon2), transactionService.js, userService.js
│  │  └─ utils/                     # app.js, server.js
│  │ 
│  ├─ tests/                        # Vitest suites (unit + integration)
│  │  ├─ integration/               # securityIntegration.test.js
|  |  ├─ unit/                      # securityValidation.test.js, transactionValidation.test.js, userValidation.test.js
│  ├─ .env                          # Environment variables
│  ├─ loggerTestSpyHelpers.js       # Logger spy helpers for the tests
│  └─ package.json
│
├─ sonar-project.properties          # SonarQube configuration
├─ .circleci/
│  └─ config.yml                    # CircleCI pipeline (SonarQube + tests)
├─ .gitignore
└─ README.md
```

<br>

## 🧪 Testing Overview

Automated tests were implemented using **Vitest** to verify both functionality and security:

- **Unit Tests**: Validate user and transaction Joi schemas.
- **Integration Tests**: Simulate malicious inputs (XSS, NoSQL injection) to confirm sanitization.
- **Pipeline Tests**: Run automatically in CircleCI before each merge to main branch.

All tests passed successfully, ensuring that input validation, authentication, and error handling operate securely under production-like conditions.

<br>

## 📸 Screenshots

<div align="center">
  
| Admin Dashboard | Dashboard | Transaction Review | Transfer Page |
|-----------------|------------------------|-------------------|-----------------|
| <img src="https://i.postimg.cc/5tyhGdKg/image.png" width="700"/> | <img src="https://i.postimg.cc/d3kg02KP/image.png" width="700"/> | <img src="https://i.postimg.cc/pLJVxHZQ/image.png" width="700"/> | <img src="https://i.postimg.cc/kGS9H34Z/image.png" width="700"/> |

</div>

<br>

## 🎥 Video Demo

📺 **Watch the full walkthrough of Security Bank Portal on YouTube:**
👉 [Click here to view](PUT YOUTUBE VIDEO!)

<br>

## 👥 Contributors

<a href="https://github.com/AlphaSweater/BudgetBuddy-Project/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AlphaSweater/BudgetBuddy-Project" />
</a>

- Chad Fairlie ST10269509
  
- Dhiren Ruthenavelu ST10256859
  
- Kayla Ferreira ST10259527
  
- Nathan Teixeira ST10249266

<br>

## 🧠 Learning Outcomes

- Implemented secure authentication using Argon2

- Designed strict input validation with Joi for user and transaction data

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

- ChatGPT assisted with explanations and documentation refinement

- ChatGPT helped with unit test creation

- ChatGPT was used to help with the design and planning. As well as assisted with finding and fixing errors in the code.

<br>
