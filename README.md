
![Logo](https://i.postimg.cc/L6MYhpN8/Logo-With-Title.png)


<h1 align="center">Security Bank Portal</h1>

<p align="center"> 
  <img src="https://img.shields.io/badge/Built%20with-Node.js-green?logo=node.js" alt="Node.js"> <img src="https://img.shields.io/badge/Security%20-%20Argon2%20%2B%20Joi-blue" alt="Argon2 and Joi">
</p>

## 📝 Overview
Security Bank Portal is a secure Node.js / Express prototype that lets users register, log in, and perform international transfers. The project focuses on real-world security practices: input validation with Joi and password hashing with Argon2. The README includes local HTTPS setup for a production-like environment during development.

Whether you’re searching for a cozy spot to study, a trendy café to meet friends, or the perfect latte, Cape Town Coffees connects you to the city’s best brews.

## 📚 Table of Contents
- [How to Install and Setup](#-how-to-install-and-setup)
- [How to Setup HTTPS Certificates](#-how-to-setup-https-certificates)
- [Features](#-features)
- [Security Implemetation and File Explanations](#-security-implemetation-and-file-explanations)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Security Implementation and File Explanation](#-security-implementation-and-file-explanation)
- [HTTPS Local Setup (Windows)](#-https-local-setup)
- [How to Run Locally](#-how-to-run-locally)
- [Contributors](#-contributors)
- [Learning Outcomes](#-learning-outcomes)
- [References](#-references)

## 🌟 Features

- Secure Sign Up and Login flows

- International money transfers with validation of amounts, currencies, SWIFT/BIC and account numbers

- Joi schemas for strong input validation and sanitisation

- Argon2id hashing for secure password storage

- Route-level rate limiting for auth endpoints

- Unit & security tests with Vitest

- Local HTTPS via mkcert for production-like dev environment

## 🔐 Security Features
- Argon2 (Argon2id) for password hashing

- Joi for input validation (users & transactions)

- Validation middleware that masks passwords in logs and returns structured error responses

- Tests that simulate NoSQL injection and XSS attempts to ensure the validation layer blocks them

- Route-level rate limiting to reduce brute-force and abuse

## 🔧 Tech Stack
- Node.js, Express.js

- Joi for validation

- argon2 for password hashing

- MongoDB (or any compatible persistence)

- Vitest for tests

- mkcert for local HTTPS certs

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
## Security Implementation and File Explanations

### authRoutes.js

- Purpose: Defines authentication endpoints (/login, /register, /logout, /sessionCheck).

- What it does: Each route composes middleware:

  - Rate limiters (prevent brute-force/spam).

  - validateData(schema) middleware — runs Joi validation on req.body.

  - asyncHandler(controller) — executes controller logic.

- Example flow: POST /register → rate limiter → Joi validation (register schema) → controller authController.register().


### validationMiddleware.js

- Purpose: Generic Express middleware that runs Joi validation for req.body, req.query, or req.params.

- Key points:

  - validateData(schema, { target }) validates target object and returns 400 with a structured error object if validation fails.

  -  Masks password-like fields when logging (for dev logs).

  -  Strips unknown fields and replaces req[target] with result.value (cleaned data).

  - Uses helper formatJoiError() to convert Joi errors into frontend-friendly { field: message } map.

- Why it matters: Centralizes validation & consistent error reporting across routes.

  
### userValidation.js

- Purpose: Contains reusable Joi helpers and the user-related schemas:

  - safeString() — trimmed strings with length limits and optional regex checks.

  - safePassword() — enforces password complexity (uppercase, lowercase, digit, special char).

  - registerUserSchema & loginUserSchema — complete rules for registration and login.

- Example (snippet):

  // Example: password helper
  const safePassword = ({ minLength = 8 } = {}) =>
    Joi.string().trim().min(minLength).max(128).required().custom(...)

- Why it matters: Keeps validation rules readable, reusable and strict — blocks malformed or malicious inputs early.

  
### transactionValidation.js

- Purpose: Joi schemas for transaction endpoints (create transaction, update status, params).

- Checks include:

  - userId is a 24-char hex (ObjectId).
  
  - amount is > 0, two decimal precision.
  
  - currencyCode is 3-letter ISO (USD, EUR, etc).
  
  - destinationBankSwift matches SWIFT/BIC pattern.
  
  - destinationAccountNumber allows common account formats (6–34 chars).
  
  - createdAtTimeZone validated as IANA zone (e.g. Africa/Johannesburg).

- Why it matters: Prevents bad or malicious transaction data (XSS, NoSQL injection-like objects) and enforces business rules.

  
### authService.js (Argon2)

- Purpose: Business logic for user registration and authentication.

- Key actions:

- registerNewUser(...):

  - Validates required fields.

  - Checks for existing email.

  - Uses argon2.hash(password, { type: argon2.argon2id }) and stores passwordHash.

- authenticateUser({ email, password }):

 - Retrieves user by email.
  
 - Uses argon2.verify(storedHash, password) to validate.

- Why Argon2: Memory-hard hashing (Argon2id) greatly increases attack cost for brute-force / GPU-based cracking.

- Argon2 usage example:

  import argon2 from 'argon2';
  // Hashing
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  // Verification
  const isValid = await argon2.verify(user.passwordHash, enteredPassword);
  

### Tests (userValidation.test.js, transactionValidation.test.js, securityValidation.test.js)

- Purpose: Automated tests using Vitest to confirm:

  - Valid input passes.
  
  - Invalid input returns 400 with specific error keys.
  
  - Simulated attack payloads (NoSQL-like objects, script tags) are blocked by validation.

- Why it matters: Demonstrates and documents that validation and security layers work as intended.

  

## 🛠️ Prerequisites 

1. **Ensure that you have Android Studio downloaded or you won't be able to run the project.**
Ensure that you have Android Studio installed on your computer.

2. If you do not have Android Studio, you can download it here:
👉 https://developer.android.com/studio

3. Make sure you have the following installed within Android Studio:
- Android SDK 26+
- Gradle 8.0+

4. Install an Android emulator or use a real device for testing.
## 🚀 How to Compile and Run The Application

1. Download and install Android Studio (Giraffe or newer) from the official site:
https://developer.android.com/studio

2. Open Android Studio on your computer.

3. Get the project files:

- Option 1 - Clone the Repository: Click "Get from Version Control" in the github repository and paste the repository link: https://github.com/AlphaSweater/CapeTownCoffees.git

- Option 2 - Download Zip File: If you downloaded a ZIP file, extract it, then click "Open" in Android Studio and select the extracted project folder.

- Wait for Gradle sync to complete. Android Studio will automatically download required dependencies.
(This may take a few minutes the first time.)

- Ensure you have the correct SDK versions installed:

- Minimum SDK version needed is 26 (36+ recommended)
(You can check or install SDKs via SDK Manager in Android Studio.)

4. Connect a device to run the app:

- Option 1: Plug in a physical Android device with USB debugging enabled.

- Option 2: Create and start an Android Emulator via Device Manager in Android Studio.

5. Click the green "Run" button at the top (or press Shift + F10) to build and launch the app.

6. The app will install and launch on your selected device, showing the BudgetBuddy application.


## 🎥 Video Demo

📺 **Watch the full walkthrough of Cape Town Coffees on YouTube:**
👉 [Click here to view](https://youtu.be/dnFBR1-XPvo?si=4kqEIKo2v5o-dgIs)


## 👥 contributors

- Chad Fairlie ST10269509
- Dhiren Ruthenavelu ST10256859
- Kayla Ferreira ST10259527
- Nathan Teixeira ST10249266

## 🧠 Learning Outcomes

- Implemented secure authentication using Argon2

- Designed strict input validation with Joi for user & transaction data

- Added route rate limiting and HTTPS for realistic security posture

- Created automated tests verifying validation blocks NoSQL/XSS attacks

- Built a layered Node.js architecture separating validation, services, and controllers

## 📚 References

- https://www.youtube.com/watch?v=A_tPafV23DM&list=PLPgs125_L-X9H6J7x4beRU-AxJ4mXe5vX
- https://www.geeksforgeeks.org/kotlin-android-tutorial/
- https://www.geeksforgeeks.org/textview-in-kotlin/
- https://www.geeksforgeeks.org/scrollview-in-android/
- https://www.geeksforgeeks.org/horizontalscrollview-in-kotlin/
- https://www.geeksforgeeks.org/cardview-in-android-with-example/
- https://www.geeksforgeeks.org/switch-in-kotlin/
- https://www.geeksforgeeks.org/spinner-in-kotlin/
- https://www.youtube.com/watch?v=KwDSkSBDyfQ
- ChatGPT was used to help with the design and planning. As well as assisted with finding and fixing errors in the code.
- ChatGPT also helped with the forming of comments for the code.


