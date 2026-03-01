import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "xpert-studio-secret"],
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true,
      sameSite: "none",
      httpOnly: true,
    })
  );

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/google/callback`
  );

  // Auth URL
  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/drive.file",
      ],
      prompt: "consent",
    });
    res.json({ url });
  });

  // Callback
  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      req.session!.tokens = tokens;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Get User Info
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      oauth2Client.setCredentials(req.session.tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      res.json(userInfo.data);
    } catch (error) {
      res.status(401).json({ error: "Session expired" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // Drive Backup: Save
  app.post("/api/drive/backup", async (req, res) => {
    if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });
    
    const { data } = req.body;
    try {
      oauth2Client.setCredentials(req.session.tokens);
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Find existing backup file
      const list = await drive.files.list({
        q: "name = 'xpert_studio_backup.json' and trashed = false",
        spaces: 'drive',
        fields: 'files(id)',
      });

      const fileMetadata = {
        name: 'xpert_studio_backup.json',
        mimeType: 'application/json',
      };
      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(data),
      };

      if (list.data.files && list.data.files.length > 0) {
        // Update existing
        const fileId = list.data.files[0].id!;
        await drive.files.update({
          fileId: fileId,
          media: media,
        });
        res.json({ success: true, updated: true });
      } else {
        // Create new
        await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        });
        res.json({ success: true, created: true });
      }
    } catch (error: any) {
      console.error("Drive Backup Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Drive Backup: Load
  app.get("/api/drive/backup", async (req, res) => {
    if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      oauth2Client.setCredentials(req.session.tokens);
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const list = await drive.files.list({
        q: "name = 'xpert_studio_backup.json' and trashed = false",
        spaces: 'drive',
        fields: 'files(id)',
      });

      if (list.data.files && list.data.files.length > 0) {
        const fileId = list.data.files[0].id!;
        const file = await drive.files.get({
          fileId: fileId,
          alt: 'media',
        });
        res.json({ data: file.data });
      } else {
        res.status(404).json({ error: "No backup found" });
      }
    } catch (error: any) {
      console.error("Drive Load Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
