## Local HTTPS Certificates (Dev Only)

We use HTTPS in development so browser behavior (cookies, secure flags, mixed-content rules) matches production. Generate trusted localhost certs once per machine and place them at:

```
./certs/localhost.crt
./certs/localhost.key
```

---

### 🚀 TL;DR

1. Create `certs/`
2. Put `mkcert` binary in repo root
3. Trust local CA: `mkcert -install` (one-time)
4. Generate cert + key into `certs/`
5. Start dev servers (they auto-use them)

---

### 1. Create the `certs/` folder

Run in the terminal from the repo root

Windows PowerShell (WPS)

```powershell
mkdir certs -Force
```

Windows Command Prompt (cmd):

```cmd
mkdir certs
```

Note: `-Force` in PowerShell suppresses the "already exists" warning.

### 2. Get mkcert (pick ONE method)

Terminal (WPS) OR (cmd):

```powershell cmd
curl.exe -L -o mkcert.exe https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-windows-amd64.exe
```

Place in repo root as:

- Windows: `mkcert.exe`

### 3. Trust the local CA (one-time per machine)

Windows (PowerShell or cmd):

```powershell
./mkcert.exe -install
```

macOS / Linux:

```bash
./mkcert -install
```

Fully quit and reopen browsers after this step.

### 4. Generate the localhost certificate + key

Windows PowerShell:

```powershell
mkdir certs -Force
./mkcert.exe -key-file ./certs/localhost.key -cert-file ./certs/localhost.crt localhost 127.0.0.1 ::1
```

Windows cmd:

```cmd
mkdir certs
mkcert.exe -key-file .\certs\localhost.key -cert-file .\certs\localhost.crt localhost 127.0.0.1 ::1
```

macOS / Linux:

```bash
mkdir -p certs
./mkcert -key-file ./certs/localhost.key -cert-file ./certs/localhost.crt localhost 127.0.0.1 ::1
```

Result:

```
certs/
   localhost.crt
   localhost.key
```

### 5. Run the dev environment

If available:

```bash
npm run bothDev
```

Or separately:

```bash
npm run dev --workspace server
npm run dev --workspace client
```

### ✅ Quick Checks

- No browser warning on local `https://` URL
- Certificate issuer mentions `mkcert`
- `certs/localhost.crt` and `certs/localhost.key` exist and are non-empty

### 🔧 Troubleshooting

| Symptom                   | Likely Cause                | Fix                                                              |
| ------------------------- | --------------------------- | ---------------------------------------------------------------- |
| Still see browser warning | Browser trust not refreshed | Quit browser fully; rerun `mkcert -install`                      |
| Files not created         | Wrong working directory     | Run commands from repo root                                      |
| `mkcert` not found        | Binary missing / wrong name | Ensure `mkcert.exe` (Windows) or `mkcert` (Unix) is in repo root |
| Permission denied (Unix)  | Not executable              | `chmod +x mkcert`                                                |

### ♻️ Regenerate Later

Delete the two files in `certs/` and repeat Step 4. You only need `mkcert -install` again on a new machine/user profile.
