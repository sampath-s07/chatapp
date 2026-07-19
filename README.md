# ChatApp 💬

A real-time WhatsApp-like chat application built with **Next.js**, **Socket.io**, and **SQLite**.

![ChatApp](./public/icon-512.png)

## ✨ Features

- 🔐 Register & Login with username + password
- 💬 Real-time 1-on-1 DMs (WebSockets via Socket.io)
- 🟢 Online / offline presence indicators
- ✓✓ Delivered & seen (blue) message ticks
- 🔴 Unread message count badges
- 💾 Persistent chat history (SQLite)
- 🔍 Contact search
- 📱 Installable PWA — works on phone & desktop
- 🌙 WhatsApp-style dark theme

## 🚀 Quick Start (Local)

### Prerequisites
- [Node.js 18+](https://nodejs.org/)

### Run locally

```bash
git clone https://github.com/YOUR_USERNAME/chatapp.git
cd chatapp
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Install as App (PWA)
- **Desktop**: Click the ⊕ install icon in Chrome/Edge address bar
- **Android**: Chrome menu → "Add to Home screen"
- **iPhone**: Safari Share → "Add to Home Screen"

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Real-time | Socket.io (WebSockets) |
| Database | SQLite via `better-sqlite3` |
| Auth | bcryptjs + JWT cookies |
| Styling | Vanilla CSS (dark theme) |

## 📁 Project Structure

```
chatapp/
├── server.js              # Custom Node.js + Socket.io server
├── app/
│   ├── globals.css        # WhatsApp dark theme
│   ├── layout.js          # Root layout + PWA meta tags
│   ├── page.js            # Login / Register page
│   ├── chat/page.js       # Main chat UI
│   └── api/               # REST API routes
│       ├── auth/          # login, register, logout
│       ├── users/         # list all users
│       └── messages/      # fetch chat history
├── components/
│   ├── Sidebar.jsx        # Contact list
│   ├── ChatWindow.jsx     # Message area
│   └── MessageBubble.jsx  # Individual message
├── lib/
│   ├── db.js              # SQLite setup
│   └── auth.js            # JWT helpers
└── public/
    ├── manifest.json      # PWA manifest
    └── sw.js              # Service worker
```

## 🌐 Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Fork this repo on GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select this repo
4. Add environment variable: `JWT_SECRET=your-secret-key-here`
5. Railway auto-detects the `Dockerfile` and deploys!
6. Get your public URL under **Settings → Networking → Generate Domain**

## 🔧 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Secret key for JWT tokens | `whatsapp-clone-secret-key-2024` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

> ⚠️ Always set a strong `JWT_SECRET` in production!

## 📜 License

MIT — free to use, modify, and distribute.

## 🤝 Contributing

Pull requests are welcome! Open an issue first to discuss major changes.
