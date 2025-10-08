# Local HTTPS Certificates Setup (Windows)

To develop with HTTPS (so your browser behaves like production), you’ll need trusted local certificates. This guide walks you through the fastest, most reliable way to generate and use them. No browser warnings, no fuss.

---

## Step-by-Step: Get Trusted Local Certs

### 1. Install mkcert

First, install mkcert using Windows’ package manager:

```powershell
winget install --id FiloSottile.mkcert -e
```

This adds mkcert to your PATH for easy use.

> **Note:** You may need to restart your terminal or VS Code after installing mkcert for the updated PATH to take effect.

---

### 2. Set up a project-local CA

Keep your CA files inside the project (not global):

```powershell
$env:CAROOT = "$PWD\.certs\ca"
mkdir .certs\ca -Force
mkcert -install   # Adds trust to your Windows user store (can be undone)
```

---

### 3. Generate your HTTPS certs

Now create the actual cert and key your app will use:

```powershell
mkdir certs -Force
mkcert -key-file .\certs\localhost.key -cert-file .\certs\localhost.crt localhost 127.0.0.1 ::1
```

- Your certs will be in `certs/`
- Your CA files will be in `.certs/ca/`

---

### 4. Clean up (optional)

To remove the CA trust and all generated files:

```powershell
$env:CAROOT = "$PWD\.certs\ca"
mkcert -uninstall
Remove-Item -Recurse -Force .\.certs\ca
```

---

## That’s it!

You now have browser-trusted HTTPS for local development, with all artifacts kept inside your project. No more browser warnings, and everything is easy to clean up or regenerate.
